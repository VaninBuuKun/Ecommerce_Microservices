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
            
            var order = new Order(customerId, command.ShippingAddress);

            foreach (var item in reserveData.Items)
            {
                order.AddItem(item.VariantId, item.ProductName, item.VariantName, item.UnitPrice, item.Quantity);
            }
            
            var orderRepo = unitOfWork.Repository<Order, Guid>();
            orderRepo.Add(order);
            
            
            var paymentResult = await paymentService.CreatePaymentAsync(order.Id, order.TotalPrice, command.PaymentProvider, cancellationToken);
            if (!paymentResult.IsSuccess)
            {
                return Result<CustomerOrderResponse>.Failure(paymentResult);
            }

            var paymentUrl = paymentResult.Value;
            
            var orderCreatedEvent = new OrderCreatedEvent
            {
                OrderId = order.Id,
                CreatedAt = DateTime.UtcNow,
                CustomerId = customerId,
                ShippingAddress = command.ShippingAddress,
                OrderItems = order.OrderItems.Select(item => new OrderItemData
                {
                    VariantId = item.VariantId,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity
                }).ToList(),
                TotalAmount = order.TotalPrice
            };
            await publisher.PublishAsync(orderCreatedEvent, cancellationToken);
            
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            var response = mapper.Map<CustomerOrderResponse>(order);
            
            return Result<CustomerOrderResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra trong quá trình tạo đơn hàng cho khách hàng: {CustomerId}", customerId);
            return Result<CustomerOrderResponse>.Failure("Có lỗi xảy ra trong quá trình xử lý đơn hàng", EErrorCode.InternalServerError);
        }
    }
}