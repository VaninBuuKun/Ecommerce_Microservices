using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Domain;
using MapsterMapper;
using Microsoft.Extensions.Logging;
namespace Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;

public class CreateOrderCommandHandler(
    ICartService cartService,
    IProductService productService,
    IPaymentService paymentService,
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CreateOrderCommandHandler> logger, IMapper mapper)
    : CommandHandler<CreateOrderCommand, CustomerOrderResponse>
{
    protected override async Task<Result<CustomerOrderResponse>> HandleCommandAsync(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var customerId = command.CustomerId;
            try
        {
            logger.LogInformation("Bắt đầu tạo đơn hàng cho khách hàng: {CustomerId}", customerId);
            
            var cartResult = await cartService.GetCartByCustomerId(customerId);

            if (!cartResult.IsSuccess)
            {
                return Result<CustomerOrderResponse>.Failure(cartResult);
            }
            
            var cartResponse = cartResult.Value;

            if (cartResponse == null || cartResponse.Items.Count == 0)
            {
                return Result<CustomerOrderResponse>.Failure("Giỏ hàng trống, không thể thanh toán", EErrorCode.InvalidInput);
            }
            
            var selectedItems = cartResponse.Items
                .Where(item => item.IsSelected)
                .ToList();

            if (selectedItems.Count == 0)
            {
                return Result<CustomerOrderResponse>.Failure("Không có sản phẩm nào được chọn để thanh toán", EErrorCode.InvalidInput);
            }
            
            var reserveItems = selectedItems.Select
                (x => new ReserveStockItemDto(x.VariantId, x.Quantity)).ToList();
            
            var reserveResult = await productService.ReserveStockAsync(reserveItems, cancellationToken);

            
            if (!reserveResult.IsSuccess)
            {
                return Result<CustomerOrderResponse>.Failure(reserveResult);
            }

            var reserveData = reserveResult.Value;

            if (!reserveData.IsValid)
            {
                return Result<CustomerOrderResponse>.Failure(reserveData.ErrorMessage ?? "Không đủ tồn kho để đặt hàng", EErrorCode.InvalidInput);
            }

            var orderId = Guid.NewGuid(); // Pre-generate Order ID to bind with release compensation if needed
            
            try
            {
                var orderRepo = unitOfWork.Repository<Order, Guid>();
                
                bool isOnlinePayment = command.PaymentProvider != "cod";
                
                // Construct Order with the pre-generated ID
                var order = new Order(customerId, command.ShippingAddress, isOnlinePayment, command.RecipientName, command.RecipientPhone, command.RecipientWardId)
                {
                    Id = orderId
                };
                orderRepo.Add(order);

                foreach (var itemDetailDto in reserveData.Items)
                {
                    order.AddOrderItem(itemDetailDto.ShopId, itemDetailDto.VariantId, itemDetailDto.ProductName, itemDetailDto.VariantName, itemDetailDto.UnitPrice, itemDetailDto.Quantity);
                }
                
                // 2. Call gRPC Payment Service (Step most likely to fail due to third-party network issues)
                var paymentResult = await paymentService.CreatePaymentAsync(order.Id, order.GrandTotal, command.PaymentProvider, cancellationToken);
                if (!paymentResult.IsSuccess)
                {
                    logger.LogWarning("Không thể tạo liên kết thanh toán cho đơn hàng {OrderId}. Tiến hành giải phóng tồn kho...", orderId);
                    await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                    return Result<CustomerOrderResponse>.Failure(paymentResult);
                }
                
                var listSubOrderCreatedEvents = order.GetSubOrders().Select(subOrder => new SubOrderCreatedEvent
                {
                    SubOrderId = subOrder.Id,
                    CreatedAt = DateTime.UtcNow,
                    CustomerId = subOrder.CustomerId,
                    ShopId = subOrder.ShopId,
                    TotalAmount = subOrder.SubTotal,
                    ShippingAddress = order.ShippingAddress,
                    RecipientName = order.RecipientName,
                    RecipientPhone = order.RecipientPhone,
                    RecipientWardId = order.RecipientWardId,
                    PaymentProvider = command.PaymentProvider,
                    OrderItems = subOrder.SubOrderItems.Select(item => new OrderItemData
                    {
                        VariantId = item.VariantId,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity
                    }).ToList()
                }).ToList();

                foreach (var @event in listSubOrderCreatedEvents)
                {
                    await publisher.PublishAsync(@event, cancellationToken);
                }

                var paymentUrl = paymentResult.Value;
                
                await unitOfWork.SaveChangesAsync(cancellationToken);
                
                var selectedVariantIds = selectedItems.Select(x => x.VariantId).ToList();
                var clearCartResult = await cartService.ClearCart(customerId, selectedVariantIds);
                if (!clearCartResult.IsSuccess)
                {
                    logger.LogWarning("Không thể tự động xóa giỏ hàng cho khách hàng {CustomerId} sau khi tạo đơn: {Error}", customerId, clearCartResult.Errors);
                }
                
                var response = mapper.Map<CustomerOrderResponse>(order);
                
                response.PaymentUrl = paymentUrl;
                return Result<CustomerOrderResponse>.Success(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Có lỗi xảy ra trong quá trình xử lý đơn hàng {OrderId} sau khi khóa tồn kho. Tiến hành giải phóng lại tồn kho...", orderId);
                await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra trong quá trình tạo đơn hàng cho khách hàng: {CustomerId}", customerId);
            return Result<CustomerOrderResponse>.Failure("Có lỗi xảy ra trong quá trình xử lý đơn hàng", EErrorCode.InternalServerError);
        }
    }

    private async Task CompensateStockRelease(Guid orderId, List<ReserveStockItemDto> items, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Compensate: Đang giải phóng tồn kho cho đơn hàng {OrderId} ({Count} mặt hàng)", orderId, items.Count);
            
            var releaseRequest = new ReleaseStocksRequest
            {
                OrderId = orderId,
                VariantItems = items.Select(x => new VariantStockData
                {
                    VariantId = x.VariantId,
                    Quantity = x.Quantity
                }).ToList()
            };

            await publisher.PublishAsync(releaseRequest, cancellationToken);
            logger.LogInformation("Compensate: Đã gửi yêu cầu giải phóng tồn kho lên EventBus thành công cho đơn {OrderId}", orderId);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "CRITICAL ERROR: Không thể gửi yêu cầu giải phóng tồn kho bù đắp cho đơn {OrderId}!", orderId);
        }
    }
}