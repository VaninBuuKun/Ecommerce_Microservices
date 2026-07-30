using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
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

namespace Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;

public class CreateOrderCommandHandler(
    ICartService cartService,
    IProductService productService,
    IPaymentService paymentService,
    IIdentityService identityService,
    IShippingService shippingService,
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CreateOrderCommandHandler> logger,
    IMapper mapper,
    ICacheService cacheService)
    : CommandHandler<CreateOrderCommand, CustomerOrderResponse>
{
    protected override async Task<Result<CustomerOrderResponse>> HandleCommandAsync(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var customerId = command.CustomerId;
        try
        {
            logger.LogInformation("Bắt đầu tạo đơn hàng cho khách hàng: {CustomerId} sử dụng UserAddressId: {AddressId}", customerId, command.UserAddressId);

            var addressResult = await identityService.GetUserAddressAsync(command.UserAddressId, customerId);
            if (!addressResult.IsSuccess || addressResult.Value == null)
            {
                logger.LogWarning("Không thể lấy thông tin địa chỉ đặt hàng: {Error}", addressResult.Message);
                return Result<CustomerOrderResponse>.Failure(addressResult);
            }

            var addressData = addressResult.Value;

            // 2. Phân giải tên Tỉnh/Huyện/Xã qua gRPC Shipping
            string provinceName = string.Empty;
            string districtName = string.Empty;
            string wardName = string.Empty;

            try
            {
                var locationResult = await shippingService.GetLocationNameAsync(addressData.ProvinceId,
                    addressData.DistrictId, addressData.WardId);

                if (!locationResult.IsSuccess)
                {
                    return Result<CustomerOrderResponse>.Failure(locationResult);
                }

                var location = locationResult.Value;
                
                provinceName = location.ProvinceName;
                districtName = location.DistrictName;
                wardName = location.WardName;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Lỗi kết nối gRPC đến Shipping Service để phân giải tên địa danh.");
                return Result<CustomerOrderResponse>.Failure("Lỗi hệ thống vận chuyển, vui lòng thử lại sau.", EErrorCode.InternalServerError);
            }

            var fullShippingAddress = $"{addressData.AddressLine}, {wardName}, {districtName}, {provinceName}";

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

            // 2.5 Lấy và xác thực thông tin đối chiếu với CheckoutSession từ Redis
            var redisKey = $"checkout_session:{command.CheckoutSessionId}";
            var checkoutSession = await cacheService.GetAsync<CheckoutSession>(redisKey, cancellationToken);
            if (checkoutSession == null)
            {
                logger.LogWarning("Không tìm thấy CheckoutSession {SessionId} hoặc phiên đã hết hạn", command.CheckoutSessionId);
                return Result<CustomerOrderResponse>.Failure("Phiên thanh toán đã hết hạn hoặc không hợp lệ. Vui lòng tải lại và đặt hàng lại.", EErrorCode.InvalidInput);
            }

            if (checkoutSession.CustomerId != customerId)
            {
                logger.LogWarning("CheckoutSession {SessionId} không thuộc về CustomerId {CustomerId}", command.CheckoutSessionId, customerId);
                return Result<CustomerOrderResponse>.Failure("Phiên thanh toán không hợp lệ.", EErrorCode.Forbidden);
            }

            if (checkoutSession.UserAddressId != command.UserAddressId)
            {
                logger.LogWarning("Địa chỉ đặt hàng không trùng khớp với CheckoutSession {SessionId}", command.CheckoutSessionId);
                return Result<CustomerOrderResponse>.Failure("Địa chỉ giao hàng đã thay đổi. Vui lòng tính toán lại tổng tiền trước khi đặt hàng.", EErrorCode.InvalidInput);
            }

            if (selectedItems.Count != checkoutSession.Items.Count)
            {
                logger.LogWarning("Số lượng mặt hàng khác biệt so với CheckoutSession {SessionId}", command.CheckoutSessionId);
                return Result<CustomerOrderResponse>.Failure("Giỏ hàng đã có sự thay đổi kể từ lúc tính toán tổng tiền. Vui lòng đặt hàng lại.", EErrorCode.InvalidInput);
            }

            foreach (var cartItem in selectedItems)
            {
                var sessionItem = checkoutSession.Items.FirstOrDefault(x => x.VariantId == cartItem.VariantId);
                if (sessionItem == null)
                {
                    logger.LogWarning("Mặt hàng {VariantId} không tồn tại trong CheckoutSession {SessionId}", cartItem.VariantId, command.CheckoutSessionId);
                    return Result<CustomerOrderResponse>.Failure("Sản phẩm trong giỏ hàng đã thay đổi. Vui lòng tính toán lại tổng tiền.", EErrorCode.InvalidInput);
                }
                if (sessionItem.Quantity != cartItem.Quantity)
                {
                    logger.LogWarning("Số lượng mặt hàng {VariantId} khác biệt so với CheckoutSession {SessionId}", cartItem.VariantId, command.CheckoutSessionId);
                    return Result<CustomerOrderResponse>.Failure("Số lượng sản phẩm trong giỏ hàng đã thay đổi. Vui lòng tính toán lại tổng tiền.", EErrorCode.InvalidInput);
                }
                if (sessionItem.UnitPrice != cartItem.UnitPrice)
                {
                    logger.LogWarning("Đơn giá mặt hàng {VariantId} khác biệt so với CheckoutSession {SessionId}", cartItem.VariantId, command.CheckoutSessionId);
                    return Result<CustomerOrderResponse>.Failure("Giá sản phẩm trong giỏ hàng đã thay đổi. Vui lòng tính toán lại tổng tiền.", EErrorCode.InvalidInput);
                }
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

            var orderId = Guid.NewGuid();
            
            try
            {
                var orderRepo = unitOfWork.Repository<Order, Guid>();
                
                bool isOnlinePayment = command.PaymentProvider != "cod";
                
                var order = new Order(customerId, fullShippingAddress, isOnlinePayment, addressData.RecipientName, addressData.Phone, addressData.WardId)
                {
                    Id = orderId
                };
                orderRepo.Add(order);

                // Dựng đơn hàng trực tiếp bằng thông tin giỏ hàng chi tiết
                foreach (var item in selectedItems)
                {
                    order.AddOrderItem(item.ShopId, item.VariantId, item.ProductName, item.VariantName, item.UnitPrice, item.Quantity);
                }

                // Áp đặt phí vận chuyển đã đóng băng trong CheckoutSession cho từng Shop
                foreach (var shopShipping in checkoutSession.ShopShippings.Values)
                {
                    order.SetShippingFee(shopShipping.ShopId, shopShipping.ShippingFee);
                }
                
                // Gọi gRPC Payment Service
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
                    OrderId = order.Id,
                    CreatedAt = DateTime.UtcNow,
                    CustomerId = subOrder.CustomerId,
                    ShopId = subOrder.ShopId,
                    TotalAmount = subOrder.SubTotal,
                    ShippingAddress = order.ShippingAddress,
                    RecipientName = order.RecipientName,
                    RecipientPhone = order.RecipientPhone,
                    RecipientWardId = order.RecipientWardId,
                    IsOnlinePayment = order.IsOnlinePayment,
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
                
                // Xóa giỏ hàng
                var selectedVariantIds = selectedItems.Select(x => x.VariantId).ToList();
                var clearCartResult = await cartService.ClearCart(customerId, selectedVariantIds);
                if (!clearCartResult.IsSuccess)
                {
                    logger.LogWarning("Không thể tự động xóa giỏ hàng cho khách hàng {CustomerId} sau khi tạo đơn: {Error}", customerId, clearCartResult.Errors);
                }

                // Xóa CheckoutSession khỏi Redis
                await cacheService.RemoveAsync(redisKey, cancellationToken);
                
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