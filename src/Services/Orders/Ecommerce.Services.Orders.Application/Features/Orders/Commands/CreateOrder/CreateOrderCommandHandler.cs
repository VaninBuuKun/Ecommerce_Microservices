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
    ICacheService cacheService,
    IVoucherValidationService voucherValidationService,
    IVoucherRepository voucherRepository)
    : CommandHandler<CreateOrderCommand, CustomerOrderResponse>
{
    protected override async Task<Result<CustomerOrderResponse>> HandleCommandAsync(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var customerId = command.CustomerId;
        try
        {
            // 1. Lấy và xác thực thông tin đối chiếu với CheckoutSession từ Redis
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

            var userAddressId = checkoutSession.UserAddressId;
            logger.LogInformation("Bắt đầu tạo đơn hàng cho khách hàng: {CustomerId} sử dụng UserAddressId: {AddressId} từ CheckoutSession", customerId, userAddressId);

            var addressResult = await identityService.GetUserAddressAsync(userAddressId, customerId);
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
                if (sessionItem.UnitPrice != cartItem.DiscountPrice)
                {
                    logger.LogWarning("Đơn giá mặt hàng {VariantId} ({SessionPrice}) khác biệt so với giỏ hàng thực tế ({CartPrice}) trong CheckoutSession {SessionId}", cartItem.VariantId, sessionItem.UnitPrice, cartItem.DiscountPrice, command.CheckoutSessionId);
                    return Result<CustomerOrderResponse>.Failure("Giá sản phẩm trong giỏ hàng đã thay đổi. Vui lòng tính toán lại tổng tiền.", EErrorCode.InvalidInput);
                }
            }

            // --- RE-VALIDATE VOUCHERS ON ACTUAL ORDER PLACEMENT ---
            decimal subTotal = selectedItems.Sum(x => x.DiscountPrice * x.Quantity);
            var shopSubTotals = selectedItems
                .GroupBy(x => x.ShopId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.DiscountPrice * x.Quantity));

            var voucherValidationResult = await voucherValidationService.ValidateVouchersAsync(
                customerId,
                subTotal,
                shopSubTotals,
                checkoutSession.PlatformVoucherCode,
                checkoutSession.ShopVoucherCodes,
                cancellationToken
            );

            if (!voucherValidationResult.IsSuccess)
            {
                logger.LogWarning("Xác thực voucher thất bại lúc tạo đơn cho khách hàng {CustomerId}: {Message}", customerId, voucherValidationResult.Message);
                return Result<CustomerOrderResponse>.Failure(voucherValidationResult.Message, voucherValidationResult.ErrorCode);
            }

            var validationData = voucherValidationResult.Value;

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
            var allVoucherIds = new List<Guid>();
            if (validationData.PlatformVoucher != null)
                allVoucherIds.Add(validationData.PlatformVoucher.Id);
            allVoucherIds.AddRange(validationData.ShopVouchers.Values.Select(v => v.Id));

            try
            {
                var orderRepo = unitOfWork.Repository<Order, Guid>();
                var voucherUsageRepo = unitOfWork.Repository<VoucherUsage, Guid>();
                
                bool isOnlinePayment = command.PaymentProvider != "cod";
                
                var order = new Order(customerId, fullShippingAddress, isOnlinePayment, addressData.RecipientName, addressData.Phone, addressData.WardId)
                {
                    Id = orderId
                };
                orderRepo.Add(order);

                // Dựng đơn hàng trực tiếp bằng thông tin giỏ hàng chi tiết (dùng giá sau chiết khấu của sản phẩm)
                foreach (var item in selectedItems)
                {
                    order.AddOrderItem(item.ShopId, item.ProductId, item.VariantId, item.ProductName, item.VariantName, item.DiscountPrice, item.Quantity, item.ThumbnailUrl);
                }

                // Áp đặt phí vận chuyển đã đóng băng trong CheckoutSession cho từng Shop
                foreach (var shopShipping in checkoutSession.ShopShippingFees)
                {
                    order.SetShippingFee(shopShipping.Key, shopShipping.Value);
                }

                // ============================================================
                // Áp đặt giảm giá voucher và ghi nhận VoucherId vào SubOrder
                // ============================================================
                var now = DateTimeOffset.UtcNow;

                // --- Atomic Increment UsageCount (TRƯỚC SaveChanges) ---
                // Chỉ cần 1 câu lệnh SQL duy nhất cập nhật toàn bộ danh sách voucher

                if (allVoucherIds.Count > 0)
                {
                    var ok = await voucherRepository.TryIncrementUsagesAsync(allVoucherIds, cancellationToken);
                    if (!ok)
                    {
                        logger.LogWarning("Có voucher trong đơn hàng đã hết lượt sử dụng — compensate stock.");
                        await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                        return Result<CustomerOrderResponse>.Failure(
                            "Một trong số các voucher áp dụng đã hết lượt sử dụng, vui lòng đặt hàng lại.", EErrorCode.InvalidInput);
                    }
                }

                // --- Áp discount & gán VoucherId vào từng SubOrder ---
                foreach (var shopId in shopSubTotals.Keys)
                {
                    validationData.ShopDiscounts.TryGetValue(shopId, out var sellerDiscount);

                    decimal shopSub = shopSubTotals[shopId];
                    decimal platformDiscountForShop = subTotal > 0
                        ? Math.Round(validationData.PlatformDiscount * (shopSub / subTotal), 2)
                        : 0;

                    order.ApplyDiscounts(shopId, (long)sellerDiscount, (long)platformDiscountForShop);

                    // Gán VoucherId vào SubOrder để phục vụ rollback khi hủy đơn
                    validationData.ShopVouchers.TryGetValue(shopId, out var shopVoucher);
                    order.ApplyVoucherIds(
                        shopId,
                        shopVoucher?.Id,
                        validationData.PlatformVoucher?.Id);
                }

                // --- Ghi VoucherUsage (batch, không query lại entity) ---
                if (validationData.PlatformVoucher != null)
                {
                    var totalPlatformDiscount = validationData.PlatformDiscount;
                    foreach (var subOrder in order.GetSubOrders())
                    {
                        decimal shopSub = shopSubTotals.TryGetValue(subOrder.ShopId, out var s) ? s : 0;
                        decimal portionDiscount = subTotal > 0
                            ? Math.Round(totalPlatformDiscount * (shopSub / subTotal), 2)
                            : 0;

                        voucherUsageRepo.Add(new VoucherUsage
                        {
                            Id = Guid.NewGuid(),
                            VoucherId = validationData.PlatformVoucher.Id,
                            UserId = customerId,
                            OrderId = order.Id,
                            SubOrderId = subOrder.Id,
                            DiscountAmount = portionDiscount,
                            UsedAt = now
                        });
                    }
                }

                foreach (var (shopId, shopVoucher) in validationData.ShopVouchers)
                {
                    var subOrder = order.GetSubOrders().FirstOrDefault(s => s.ShopId == shopId);
                    if (subOrder == null) continue;

                    validationData.ShopDiscounts.TryGetValue(shopId, out var shopDiscountAmount);
                    voucherUsageRepo.Add(new VoucherUsage
                    {
                        Id = Guid.NewGuid(),
                        VoucherId = shopVoucher.Id,
                        UserId = customerId,
                        OrderId = order.Id,
                        SubOrderId = subOrder.Id,
                        DiscountAmount = shopDiscountAmount,
                        UsedAt = now
                    });
                }
                
                // Gọi gRPC Payment Service
                var paymentResult = await paymentService.CreatePaymentAsync(order.Id, order.GrandTotal, command.PaymentProvider, cancellationToken);
                if (!paymentResult.IsSuccess)
                {
                    logger.LogWarning("Không thể tạo liên kết thanh toán cho đơn hàng {OrderId}. Tiến hành giải phóng tồn kho và hoàn trả voucher...", orderId);
                    await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                    await CompensateVouchersRelease(allVoucherIds, cancellationToken);
                    return Result<CustomerOrderResponse>.Failure(paymentResult);
                }
                
                var listSubOrderCreatedEvents = order.GetSubOrders().Select(subOrder => new SubOrderCreatedEvent
                {
                    SubOrderId = subOrder.Id,
                    OrderId = order.Id,
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
                        VariantId = item.VariantId,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        ProductName = string.IsNullOrEmpty(item.VariantName) 
                            ? item.ProductName 
                            : $"{item.ProductName} - {item.VariantName}"
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
                logger.LogError(ex, "Có lỗi xảy ra trong quá trình xử lý đơn hàng {OrderId} sau khi khóa tồn kho. Tiến hành giải phóng tồn kho và hoàn trả voucher...", orderId);
                await CompensateStockRelease(orderId, reserveItems, cancellationToken);
                await CompensateVouchersRelease(allVoucherIds, cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra trong quá trình tạo đơn hàng cho khách hàng: {CustomerId}", customerId);
            return Result<CustomerOrderResponse>.Failure("Có lỗi xảy ra trong quá trình xử lý đơn hàng", EErrorCode.InternalServerError);
        }
    }

    private async Task CompensateVouchersRelease(List<Guid> voucherIds, CancellationToken cancellationToken)
    {
        if (voucherIds == null || voucherIds.Count == 0) return;
        try
        {
            logger.LogInformation("Compensate: Đang hoàn trả lượt dùng cho các voucher: {VoucherIds}", string.Join(", ", voucherIds));
            await voucherRepository.DecrementUsagesAsync(voucherIds, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra trong quá trình compensate voucher.");
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