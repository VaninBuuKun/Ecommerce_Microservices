using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CalOrderGrandTotal;

public class CalOrderGrandTotalCommandHandler(
    ICartService cartService,
    ISellerService sellerService,
    IShippingService shippingService,
    IIdentityService identityService,
    ICacheService cacheService,
    ILogger<CalOrderGrandTotalCommandHandler> logger)
    : ICommandHandler<CalOrderGrandTotalCommand, CalOrderGrandTotalResponse>
{
    public async Task<Result<CalOrderGrandTotalResponse>> Handle(CalOrderGrandTotalCommand command, CancellationToken cancellationToken)
    {
        var customerId = command.CustomerId;
        logger.LogInformation("Bắt đầu tính toán tổng tiền đơn hàng và phí ship cho khách hàng: {CustomerId}", customerId);

        try
        {
            // Kiểm tra địa chỉ người nhận
            var addressResult = await identityService.GetUserAddressAsync(command.UserAddressId, customerId);
            if (!addressResult.IsSuccess || addressResult.Value == null)
            {
                logger.LogWarning("Không tìm thấy địa chỉ người nhận {AddressId}: {Error}", command.UserAddressId, addressResult.Message);
                return Result<CalOrderGrandTotalResponse>.Failure($"Không tìm thấy địa chỉ nhận hàng của bạn", EErrorCode.NotFound);
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
            var shopNames = new Dictionary<long, string>();

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
                var ghnShopId = shopShippingInfo.GhnShopId ?? string.Empty;
                shopNames[shopId] = shopShippingInfo.ShopName;

                // Tính toán trọng lượng/kích thước gói hàng lũy kế thực tế từ sản phẩm
                double totalWeight = shopItems.Sum(x => (x.Weight > 0 ? x.Weight : 500) * x.Quantity); // default 500g
                double maxLength = shopItems.Max(x => x.Length > 0 ? x.Length : 20); // default 20cm
                double maxWidth = shopItems.Max(x => x.Width > 0 ? x.Width : 15); // default 15cm
                double totalHeight = shopItems.Sum(x => (x.Height > 0 ? x.Height : 5) * x.Quantity); // default 5cm

                batchRequests.Add(new ShippingFeeRequestItem(
                    shopId,
                    ghnShopId,
                    recipientWardId,
                    totalWeight,
                    maxLength,
                    maxWidth,
                    totalHeight
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
            var shopShippings = new Dictionary<long, decimal>();

            foreach (var feeResponse in batchFeeResult.Value)
            {
                if (!feeResponse.IsSuccess)
                {
                    logger.LogWarning("Không thể tính phí vận chuyển cho Shop {ShopId}: {Error}", feeResponse.ShopId, feeResponse.ErrorMessage);
                    return Result<CalOrderGrandTotalResponse>.Failure($"Lỗi tính phí vận chuyển cho shop {feeResponse.ShopId}: {feeResponse.ErrorMessage}", EErrorCode.InvalidInput);
                }

                totalShippingFee += feeResponse.Fee;
                shopShippings[feeResponse.ShopId] = feeResponse.Fee;
            }

            var grandTotal = subTotal + totalShippingFee;

            // Tạo hoặc tái sử dụng CheckoutSessionId
            var checkoutSessionId = command.CheckoutSessionId ?? Guid.NewGuid();
            var checkoutSession = new CheckoutSession
            {
                CheckoutSessionId = checkoutSessionId,
                CustomerId = customerId,
                UserAddressId = command.UserAddressId,
                Items = checkoutSessionItems,
                ShopShippingFees = shopShippings,
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

            // Xây dựng DTO phản hồi chi tiết cho checkout page
            var shopGroups = new List<CheckoutShopGroupDto>();
            foreach (var shopGroup in groupedItems)
            {
                var shopId = shopGroup.Key;
                var shopItems = shopGroup.Select(item => new CheckoutItemDto
                {
                    VariantId = item.VariantId,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity
                }).ToList();

                shopGroups.Add(new CheckoutShopGroupDto
                {
                    ShopId = shopId,
                    ShopName = shopNames.TryGetValue(shopId, out var name) ? name : $"Shop {shopId}",
                    ShippingFee = shopShippings.TryGetValue(shopId, out var fee) ? fee : 0,
                    Items = shopItems
                });
            }

            return Result<CalOrderGrandTotalResponse>.Success(new CalOrderGrandTotalResponse
            {
                Id = checkoutSessionId.ToString(),
                ShopShippingFee = shopShippings,
                ShopGroups = shopGroups,
                SubTotal = subTotal,
                TotalShippingFee = totalShippingFee,
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