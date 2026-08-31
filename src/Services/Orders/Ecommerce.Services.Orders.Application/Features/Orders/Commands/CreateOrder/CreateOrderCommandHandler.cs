using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Orders.Domain;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    ICartService cartService,
    IProductService productService,
    IIdentityService identityService,
    IPaymentService paymentService,
    IVoucherRepository voucherRepository,
    ICacheService cacheService,
    ISnowflakeIdGenerator snowflakeIdGenerator,
    IEventPublisher publisher,
    IMapper mapper,
    ILogger<CreateOrderCommandHandler> logger)
    : CommandHandler<CreateOrderCommand, CustomerOrderResponse>
{
    protected override async Task<Result<CustomerOrderResponse>> HandleCommandAsync(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        long customerId = command.CustomerId;
        logger.LogInformation("Bắt đầu khởi tạo đơn hàng cho khách hàng {CustomerId} từ Redis CheckoutSession Key: {SessionKey}", customerId, command.CheckoutSessionKey);

        var redisKey = $"checkout_session:{command.CheckoutSessionKey}";
        var checkoutSession = await cacheService.GetAsync<CheckoutSession>(redisKey, cancellationToken);
        if (checkoutSession == null)
        {
            return Result<CustomerOrderResponse>.Failure("Phiên thanh toán đã hết hạn hoặc không tồn tại. Vui lòng tiến hành thanh toán lại từ giỏ hàng.", EErrorCode.NotFound);
        }

        if (checkoutSession.CustomerId != customerId)
        {
            return Result<CustomerOrderResponse>.Failure("Phiên thanh toán này không thuộc về tài khoản của bạn.", EErrorCode.Unauthorized);
        }

        var selectedItems = checkoutSession.Items;
        if (selectedItems == null || !selectedItems.Any())
        {
            return Result<CustomerOrderResponse>.Failure("Không tìm thấy sản phẩm nào được chọn trong phiên thanh toán.", EErrorCode.ValidationErrors);
        }

        var addressResult = await identityService.GetUserAddressAsync(command.AddressId, customerId);
        if (!addressResult.IsSuccess)
        {
            return Result<CustomerOrderResponse>.Failure(addressResult.Message ?? "Không tìm thấy địa chỉ giao hàng", addressResult.ErrorCode);
        }

        var addressData = addressResult.Value!;
        string fullShippingAddress = addressData.AddressLine;

        // Giữ tồn kho trước khi tạo đơn hàng (Quy tắc: nếu có VariantId thì ProductId = 0; nếu là sản phẩm đơn thì VariantId = 0)
        var reserveItems = selectedItems.Select(item => new ReserveStockItemDto(
            ProductId: item.VariantId > 0 ? 0 : item.ProductId,
            VariantId: item.VariantId > 0 ? item.VariantId : 0,
            Quantity: item.Quantity
        )).ToList();
        var reserveResult = await productService.ReserveStockAsync(reserveItems, cancellationToken);
        if (!reserveResult.IsSuccess || (reserveResult.Value != null && !reserveResult.Value.IsValid))
        {
            return Result<CustomerOrderResponse>.Failure(reserveResult.Value?.ErrorMessage ?? reserveResult.Message ?? "Không đủ tồn kho để đặt hàng", EErrorCode.InvalidInput);
        }

        var allVoucherIds = new List<long>();
        long orderId = snowflakeIdGenerator.NewId();

        try
        {
            var orderRepo = unitOfWork.Repository<Order, long>();

            bool isOnlinePayment = command.PaymentProvider != "cod";
            var order = new Order(orderId, customerId, fullShippingAddress, isOnlinePayment, addressData.RecipientName, addressData.Phone, addressData.WardId);

            var shopToSubOrderIdMap = new Dictionary<long, long>();

            foreach (var item in selectedItems)
            {
                long shopId = item.ShopId;
                if (!shopToSubOrderIdMap.TryGetValue(shopId, out var subOrderId))
                {
                    subOrderId = snowflakeIdGenerator.NewId();
                    shopToSubOrderIdMap[shopId] = subOrderId;
                }

                long orderItemId = snowflakeIdGenerator.NewId();
                order.AddOrderItem(
                    subOrderId,
                    shopId,
                    item.ProductId,
                    item.VariantId,
                    item.ProductName,
                    item.VariantName,
                    item.UnitPrice,
                    item.Quantity,
                    item.ThumbnailUrl,
                    orderItemId);
            }

            foreach (var shopShipping in checkoutSession.ShopShippingFees)
            {
                order.SetShippingFee(shopShipping.Key, (long)shopShipping.Value);
            }

            string? paymentUrl = null;

            // Nếu là thanh toán Online -> Gọi Payment Service để khởi tạo phiên thanh toán trước khi commit DB
            if (isOnlinePayment)
            {
                var paymentResult = await paymentService.CreatePaymentAsync(orderId, order.GrandTotal, command.PaymentProvider, cancellationToken);
                if (!paymentResult.IsSuccess)
                {
                    logger.LogWarning("Tạo thanh toán thất bại cho đơn {OrderId}. Giải phóng tồn kho và hủy phiên...", orderId);
                    await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                    await CompensateVouchersRelease(allVoucherIds, cancellationToken);
                    return Result<CustomerOrderResponse>.Failure(paymentResult);
                }

                paymentUrl = paymentResult.Value;
            }
            
            orderRepo.Add(order);
            
            var listSubOrderCreatedEvents = order.GetSubOrders().Select(subOrder => new SubOrderCreatedEvent
            {
                SubOrderId = subOrder.Id,
                OrderId = orderId,
                CreatedAt = DateTime.UtcNow,
                CustomerId = subOrder.CustomerId,
                ShopId = subOrder.ShopId,
                TotalAmount = subOrder.GrandTotal,
                ShippingAddress = order.ShippingAddress,
                RecipientName = order.RecipientName,
                RecipientPhone = order.RecipientPhone,
                RecipientWardId = order.RecipientWardId,
                IsOnlinePayment = order.IsOnlinePayment,
                OrderItems = subOrder.SubOrderItems.Select(item => new OrderItemData
                {
                    ProductId = item.VariantId > 0 ? 0 : item.ProductId,
                    VariantId = item.VariantId > 0 ? item.VariantId : 0,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    ProductName = string.IsNullOrEmpty(item.VariantName) || item.VariantName == "No variants found"
                        ? item.ProductName 
                        : $"{item.ProductName} - {item.VariantName}"
                }).ToList()
            }).ToList();

            foreach (var @event in listSubOrderCreatedEvents)
            {
                await publisher.PublishAsync(@event, cancellationToken);
            }
            
            await unitOfWork.SaveChangesAsync(cancellationToken);

            // Xóa giỏ hàng & session cache sau khi commit thành công
            var selectedVariantIds = selectedItems.Select(x => x.VariantId).ToList();
            await cartService.ClearCart(customerId, selectedVariantIds);
            await cacheService.RemoveAsync(redisKey, cancellationToken);

            var response = mapper.Map<CustomerOrderResponse>(order);
            response.PaymentUrl = paymentUrl;
            return Result<CustomerOrderResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra trong quá trình xử lý đơn hàng {OrderId}. Thực hiện giải phóng tồn kho bù đắp...", orderId);
            await CompensateStockRelease(orderId, reserveItems, cancellationToken);
            await CompensateVouchersRelease(allVoucherIds, cancellationToken);
            throw;
        }
    }

    private async Task CompensateVouchersRelease(List<long> voucherIds, CancellationToken cancellationToken)
    {
        if (voucherIds == null || !voucherIds.Any()) return;
        try
        {
            logger.LogInformation("Compensate: Đang hoàn lại lượt sử dụng cho {Count} voucher", voucherIds.Count);
            await voucherRepository.DecrementUsagesAsync(voucherIds, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "CRITICAL ERROR: Không thể hoàn lượt sử dụng voucher trong bù đắp!");
        }
    }

    private async Task CompensateStockRelease(long orderId, List<ReserveStockItemDto> items, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Compensate: Giải phóng tồn kho cho đơn hàng {OrderId} ({Count} mặt hàng)", orderId, items.Count);
            var releaseRequest = new ReleaseStocksRequest
            {
                OrderId = orderId,
                VariantItems = items.Select(x => new VariantStockData
                {
                    ProductId = x.ProductId,
                    VariantId = x.VariantId,
                    Quantity = x.Quantity
                }).ToList()
            };
            await publisher.PublishAsync(releaseRequest, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "CRITICAL ERROR: Không thể gửi yêu cầu giải phóng tồn kho cho đơn {OrderId}!", orderId);
        }
    }
}