using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Sellers;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CalOrderGrandTotal;

public class CalOrderGrandTotalCommandHandler(
    ICartService cartService,
    IIdentityService identityService,
    ILogger<CalOrderGrandTotalCommandHandler> logger,
    IShippingService shippingService,
    ISellerService sellerService,
    ICacheService cacheService
    ) : CommandHandler<CalOrderGrandTotalCommand, CalOrderGrandTotalResponse>
{
    protected override async Task<Result<CalOrderGrandTotalResponse>> HandleCommandAsync(CalOrderGrandTotalCommand command, CancellationToken cancellationToken)
    {
        var customerId = command.CustomerId;
        try
        {
            logger.LogInformation("Bắt đầu tính toán đơn hàng cho khách hàng: {CustomerId} sử dụng UserAddressId: {AddressId}", customerId, command.UserAddressId);
            
            var addressResult = await identityService.GetUserAddressAsync(command.UserAddressId, customerId);
            if (!addressResult.IsSuccess || addressResult.Value == null)
            {
                logger.LogWarning("Không thể lấy thông tin địa chỉ đặt hàng: {Error}", addressResult.Message);
                return Result<CalOrderGrandTotalResponse>.Failure(addressResult);
            }

            var addressData = addressResult.Value;
            var recipientWardId = addressData.WardId;
            
            var cartResult = await cartService.GetCartByCustomerId(customerId);
            if (!cartResult.IsSuccess)
            {
                return Result<CalOrderGrandTotalResponse>.Failure(cartResult);
            }
            
            var cartResponse = cartResult.Value;
            if (cartResponse == null || cartResponse.Items.Count == 0)
            {
                return Result<CalOrderGrandTotalResponse>.Failure("Giỏ hàng trống, không thể thanh toán", EErrorCode.InvalidInput);
            }
            
            var selectedItems = cartResponse.Items
                .Where(item => item.IsSelected)
                .ToList();

            if (selectedItems.Count == 0)
            {
                return Result<CalOrderGrandTotalResponse>.Failure("Không có sản phẩm nào được chọn để thanh toán", EErrorCode.InvalidInput);
            }

            decimal subTotal = 0;
            var checkoutSessionItems = new List<CheckoutSessionItem>();
            var groupedItems = selectedItems.GroupBy(item => item.ShopId);
            var batchRequests = new List<ShippingFeeRequestItem>();

            // Chuẩn bị dữ liệu và thông tin shop gửi hàng
            foreach (var shopGroup in groupedItems)
            {
                var shopId = shopGroup.Key;
                var shopItems = shopGroup.ToList();

                // Lấy thông tin địa chỉ lấy hàng của Shop
                var shopShippingInfoResult = await sellerService.GetShopShippingInfoAsync(shopId, cancellationToken);
                if (!shopShippingInfoResult.IsSuccess || shopShippingInfoResult.Value == null)
                {
                    logger.LogWarning("Không thể lấy thông tin địa chỉ của Shop {ShopId}: {Error}", shopId, shopShippingInfoResult.Message);
                    return Result<CalOrderGrandTotalResponse>.Failure($"Không thể lấy thông tin địa chỉ lấy hàng của cửa hàng {shopId}", EErrorCode.NotFound);
                }

                var shopShippingInfo = shopShippingInfoResult.Value;
                var senderWardId = shopShippingInfo.WardId;

                // Xác định phương thức vận chuyển trừu tượng (Mặc định là "fast")
                string shippingMethod = "fast";
                if (command.ShopShippingSelections != null && command.ShopShippingSelections.TryGetValue(shopId, out var selectedMethod))
                {
                    if (!string.IsNullOrEmpty(selectedMethod))
                    {
                        shippingMethod = selectedMethod;
                    }
                }

                // Tính toán trọng lượng/kích thước gói hàng lũy kế thực tế từ sản phẩm
                double totalWeight = shopItems.Sum(x => (x.Weight > 0 ? x.Weight : 500) * x.Quantity); // default 500g
                double maxLength = shopItems.Max(x => x.Length > 0 ? x.Length : 20); // default 20cm
                double maxWidth = shopItems.Max(x => x.Width > 0 ? x.Width : 15); // default 15cm
                double totalHeight = shopItems.Sum(x => (x.Height > 0 ? x.Height : 5) * x.Quantity); // default 5cm

                batchRequests.Add(new ShippingFeeRequestItem(
                    shopId,
                    senderWardId,
                    recipientWardId,
                    totalWeight,
                    maxLength,
                    maxWidth,
                    totalHeight,
                    shippingMethod
                ));

                foreach (var item in shopItems)
                {
                    subTotal += item.UnitPrice * item.Quantity;
                    checkoutSessionItems.Add(new CheckoutSessionItem
                    {
                        VariantId = item.VariantId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    });
                }
            }

            // Gọi dịch vụ tính phí ship hàng loạt qua 1 cuộc gọi gRPC duy nhất
            logger.LogInformation("Gửi {Count} yêu cầu tính phí ship hàng loạt tới Shipping Service", batchRequests.Count);
            var batchFeeResult = await shippingService.CalculateBatchShippingFeeAsync(batchRequests, cancellationToken);
            if (!batchFeeResult.IsSuccess || batchFeeResult.Value == null)
            {
                logger.LogWarning("Lỗi khi tính phí vận chuyển hàng loạt: {Error}", batchFeeResult.Message);
                return Result<CalOrderGrandTotalResponse>.Failure($"Lỗi tính phí vận chuyển: {batchFeeResult.Message}", EErrorCode.InvalidInput);
            }

            decimal totalShippingFee = 0;
            var shopShippings = new Dictionary<long, CheckoutSessionShopShipping>();

            foreach (var feeResponse in batchFeeResult.Value)
            {
                if (!feeResponse.IsSuccess)
                {
                    logger.LogWarning("Không thể tính phí vận chuyển cho Shop {ShopId}: {Error}", feeResponse.ShopId, feeResponse.ErrorMessage);
                    return Result<CalOrderGrandTotalResponse>.Failure($"Lỗi tính phí vận chuyển cho shop {feeResponse.ShopId}: {feeResponse.ErrorMessage}", EErrorCode.InvalidInput);
                }

                totalShippingFee += feeResponse.Fee;
                var requestItem = batchRequests.First(r => r.ShopId == feeResponse.ShopId);

                shopShippings[feeResponse.ShopId] = new CheckoutSessionShopShipping
                {
                    ShopId = feeResponse.ShopId,
                    ShippingFee = feeResponse.Fee,
                    ShippingProviderCode = requestItem.ShippingMethod
                };
            }

            var grandTotal = subTotal + totalShippingFee;

            // Tạo CheckoutSession
            var checkoutSessionId = Guid.NewGuid();
            var checkoutSession = new CheckoutSession
            {
                CheckoutSessionId = checkoutSessionId,
                CustomerId = customerId,
                UserAddressId = command.UserAddressId,
                Items = checkoutSessionItems,
                ShopShippings = shopShippings,
                SubTotal = subTotal,
                TotalShippingFee = totalShippingFee,
                GrandTotal = grandTotal,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };

            // Lưu vào Redis
            var redisKey = $"checkout_session:{checkoutSessionId}";
            await cacheService.SetAsync(redisKey, checkoutSession, TimeSpan.FromMinutes(15), cancellationToken);

            logger.LogInformation("Đã lưu CheckoutSession thành công trong Redis với ID: {SessionId}. GrandTotal: {Total}", checkoutSessionId, grandTotal);

            return Result<CalOrderGrandTotalResponse>.Success(new CalOrderGrandTotalResponse
            {
                QuoteId = checkoutSessionId.ToString(),
                GrandTotal = grandTotal
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra trong quá trình tính toán đơn hàng cho khách hàng: {CustomerId}", customerId);
            return Result<CalOrderGrandTotalResponse>.Failure("Có lỗi xảy ra trong quá trình xử lý đơn hàng", EErrorCode.InternalServerError);
        }
    }
}