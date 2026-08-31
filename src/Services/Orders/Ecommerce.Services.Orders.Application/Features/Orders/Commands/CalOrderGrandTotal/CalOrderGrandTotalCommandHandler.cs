using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CalOrderGrandTotal;

public class CalOrderGrandTotalCommandHandler(
    ICartService cartService,
    ISellerService sellerService,
    IShippingService shippingService,
    IIdentityService identityService,
    ICacheService cacheService,
    IEfUnitOfWork unitOfWork,
    IVoucherValidationService voucherValidationService,
    ILogger<CalOrderGrandTotalCommandHandler> logger)
    : ICommandHandler<CalOrderGrandTotalCommand, CalOrderGrandTotalResponse>
{
    private IGenericEfRepository<Voucher, long> voucherRepo => unitOfWork.Repository<Voucher, long>();
    private IGenericEfRepository<VoucherUsage, Guid> voucherUsageRepo => unitOfWork.Repository<VoucherUsage, Guid>();

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
            var groupedItems = selectedItems.GroupBy(item => item.ShopId).ToList();
            var batchRequests = new List<ShippingFeeRequestItem>();
            var shopNames = new Dictionary<long, string>();
            var shopSubTotals = new Dictionary<long, decimal>();

            // Lấy thông tin địa chỉ lấy hàng của tất cả Shop hàng loạt qua 1 cuộc gọi gRPC
            var shopIdsForGrpc = groupedItems.Select(g => g.Key).ToList();
            var shopsShippingInfoResult = await sellerService.GetShopsShippingInfoAsync(shopIdsForGrpc, cancellationToken);
            if (!shopsShippingInfoResult.IsSuccess || shopsShippingInfoResult.Value == null)
            {
                logger.LogWarning("Không thể lấy thông tin địa chỉ của các cửa hàng: {Error}", shopsShippingInfoResult.Message);
                return Result<CalOrderGrandTotalResponse>.Failure($"Không thể lấy thông tin địa chỉ lấy hàng của các cửa hàng", EErrorCode.NotFound);
            }

            var shopsShippingInfoDict = shopsShippingInfoResult.Value.ToDictionary(s => s.ShopId);

            // Chuẩn bị dữ liệu và thông tin shop gửi hàng
            foreach (var shopGroup in groupedItems)
            {
                var shopId = shopGroup.Key;
                var shopItems = shopGroup.ToList();

                if (!shopsShippingInfoDict.TryGetValue(shopId, out var shopShippingInfo))
                {
                    logger.LogWarning("Không tìm thấy thông tin địa chỉ lấy hàng cho Shop {ShopId}", shopId);
                    return Result<CalOrderGrandTotalResponse>.Failure($"Không tìm thấy thông tin địa chỉ lấy hàng của cửa hàng {shopId}", EErrorCode.NotFound);
                }

                shopNames[shopId] = shopShippingInfo.ShopName;

                // Tính toán trọng lượng/kích thước gói hàng lũy kế thực tế từ sản phẩm
                double totalWeight = shopItems.Sum(x => (x.Weight > 0 ? x.Weight : 500) * x.Quantity); // default 500g
                double maxLength = shopItems.Max(x => x.Length > 0 ? x.Length : 20); // default 20cm
                double maxWidth = shopItems.Max(x => x.Width > 0 ? x.Width : 15); // default 15cm
                double totalHeight = shopItems.Sum(x => (x.Height > 0 ? x.Height : 5) * x.Quantity); // default 5cm

                batchRequests.Add(new ShippingFeeRequestItem(
                    shopId,
                    shopShippingInfo.WardId,
                    recipientWardId,
                    totalWeight,
                    maxLength,
                    maxWidth,
                    totalHeight
                ));

                decimal shopSubTotal = 0;
                foreach (var item in shopItems)
                {
                    var itemSubTotal = item.DiscountPrice * item.Quantity;
                    subTotal += itemSubTotal;
                    shopSubTotal += itemSubTotal;
                    checkoutSessionItems.Add(new CheckoutSessionItem
                    {
                        ShopId = item.ShopId,
                        ProductId = item.ProductId,
                        VariantId = item.VariantId,
                        ProductName = item.ProductName,
                        VariantName = item.VariantName,
                        ThumbnailUrl = item.ThumbnailUrl,
                        Quantity = item.Quantity,
                        UnitPrice = item.DiscountPrice
                    });
                }
                shopSubTotals[shopId] = shopSubTotal;
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

            // --- VOUCHER CALCULATION LOGIC ---
            var voucherValidationResult = await voucherValidationService.ValidateVouchersAsync(
                customerId,
                subTotal,
                shopSubTotals,
                command.PlatformVoucherCode,
                command.ShopVoucherCodes,
                cancellationToken
            );

            if (!voucherValidationResult.IsSuccess)
            {
                return Result<CalOrderGrandTotalResponse>.Failure(voucherValidationResult.Message, voucherValidationResult.ErrorCode);
            }

            var validationData = voucherValidationResult.Value;
            decimal platformDiscount = validationData.PlatformDiscount;
            var shopDiscounts = validationData.ShopDiscounts;
            var appliedShopVouchers = validationData.ShopVouchers.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Code);

            decimal totalDiscount = platformDiscount + shopDiscounts.Values.Sum();
            var grandTotal = Math.Max(0, subTotal + totalShippingFee - totalDiscount);

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
                TotalDiscount = totalDiscount,
                PlatformDiscount = platformDiscount,
                ShopDiscounts = shopDiscounts,
                PlatformVoucherCode = command.PlatformVoucherCode,
                ShopVoucherCodes = appliedShopVouchers,
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

                shopSubTotals.TryGetValue(shopId, out var shopSub);
                shopDiscounts.TryGetValue(shopId, out var shopDisc);
                appliedShopVouchers.TryGetValue(shopId, out var shopVCode);

                shopGroups.Add(new CheckoutShopGroupDto
                {
                    ShopId = shopId,
                    ShopName = shopNames.TryGetValue(shopId, out var name) ? name : $"Shop {shopId}",
                    ShippingFee = shopShippings.TryGetValue(shopId, out var fee) ? fee : 0,
                    SubTotalForShop = shopSub,
                    ShopDiscount = shopDisc,
                    VoucherCode = shopVCode,
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
                TotalDiscount = totalDiscount,
                PlatformDiscount = platformDiscount,
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