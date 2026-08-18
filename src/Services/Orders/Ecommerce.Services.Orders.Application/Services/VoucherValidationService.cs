using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Services;

/// <summary>
/// Validate voucher trước khi tạo đơn hàng.
/// Chỉ thực hiện pre-check nhanh (IsActive, dates, minOrder, per-user limit).
/// Check race condition (UsageCount) được thực hiện bằng atomic increment trong Handler.
/// </summary>
public class VoucherValidationService(IEfUnitOfWork unitOfWork) : IVoucherValidationService
{
    private IGenericEfRepository<Voucher, Guid> voucherRepo => unitOfWork.Repository<Voucher, Guid>();
    private IGenericEfRepository<VoucherUsage, Guid> voucherUsageRepo => unitOfWork.Repository<VoucherUsage, Guid>();

    public async Task<Result<VoucherValidationResult>> ValidateVouchersAsync(
        long customerId,
        decimal totalOrderSubtotal,
        Dictionary<long, decimal> shopSubtotals,
        string? platformVoucherCode,
        Dictionary<long, string>? shopVoucherCodes,
        CancellationToken cancellationToken
    )
    {
        var result = new VoucherValidationResult { IsSuccess = true };
        var now = DateTimeOffset.UtcNow;

        // 1. Validate Shop Vouchers
        var shopVoucherCodesDict = shopVoucherCodes ?? new Dictionary<long, string>();
        if (shopVoucherCodesDict.Count > 0)
        {
            var shopCodes = shopVoucherCodesDict.Values.Distinct().ToList();
            var shopIds = shopVoucherCodesDict.Keys.Distinct().ToList();

            // Lấy tất cả voucher shop phù hợp trong 1 query
            var dbVouchers = await voucherRepo.GetAllAsync(v =>
                v.Scope == VoucherScope.Shop &&
                v.ShopId.HasValue && shopIds.Contains(v.ShopId.Value) &&
                shopCodes.Contains(v.Code) &&
                v.IsActive &&
                v.StartDate <= now &&
                now <= v.EndDate,
                cancellationToken: cancellationToken);

            var validVouchersDict = dbVouchers
                .Where(v => v.ShopId.HasValue)
                .ToDictionary(v => v.ShopId!.Value);

            // Batch query per-user usage (không N+1)
            var voucherIds = dbVouchers.Select(v => v.Id).ToList();
            var userUsageCountsDict = new Dictionary<Guid, int>();

            if (voucherIds.Count > 0)
            {
                var userUsages = await voucherUsageRepo.GetAllAsync(u =>
                    voucherIds.Contains(u.VoucherId) && u.UserId == customerId,
                    cancellationToken: cancellationToken);

                userUsageCountsDict = userUsages
                    .GroupBy(u => u.VoucherId)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach (var kvp in shopVoucherCodesDict)
            {
                var shopId = kvp.Key;
                var code = kvp.Value;

                if (string.IsNullOrWhiteSpace(code) || !shopSubtotals.TryGetValue(shopId, out var shopSubTotal))
                    continue;

                if (!validVouchersDict.TryGetValue(shopId, out var voucher) || voucher.Code != code)
                {
                    return Result<VoucherValidationResult>.Failure(
                        $"Voucher shop '{code}' không khả dụng hoặc đã hết hạn", EErrorCode.InvalidInput);
                }

                if (shopSubTotal < voucher.MinOrderValue)
                {
                    return Result<VoucherValidationResult>.Failure(
                        $"Voucher shop '{code}' yêu cầu đơn tối thiểu {voucher.MinOrderValue:N0}đ", EErrorCode.InvalidInput);
                }

                // Pre-check nhanh UsageCount (không atomic — race condition cuối cùng được xử lý bằng TryIncrementUsage)
                if (voucher.UsageCount >= voucher.MaxUsageCount)
                {
                    return Result<VoucherValidationResult>.Failure(
                        $"Voucher shop '{code}' đã hết lượt sử dụng", EErrorCode.InvalidInput);
                }

                userUsageCountsDict.TryGetValue(voucher.Id, out var userUsageCount);
                if (userUsageCount >= voucher.MaxUsagePerUser)
                {
                    return Result<VoucherValidationResult>.Failure(
                        $"Bạn đã đạt giới hạn sử dụng voucher shop '{code}'", EErrorCode.InvalidInput);
                }

                decimal discount = CalculateDiscount(voucher, shopSubTotal);

                result.ShopDiscounts[shopId] = discount;
                result.ShopVouchers[shopId] = voucher;
            }
        }

        // 2. Validate Platform Voucher
        if (!string.IsNullOrWhiteSpace(platformVoucherCode))
        {
            var code = platformVoucherCode;
            var voucher = await voucherRepo.FirstOrDefaultAsync(v =>
                v.Code == code &&
                v.Scope == VoucherScope.Platform &&
                v.IsActive &&
                v.StartDate <= now &&
                now <= v.EndDate,
                cancellationToken: cancellationToken);

            if (voucher == null)
            {
                return Result<VoucherValidationResult>.Failure(
                    $"Voucher sàn '{code}' không khả dụng hoặc đã hết hạn", EErrorCode.InvalidInput);
            }

            if (totalOrderSubtotal < voucher.MinOrderValue)
            {
                return Result<VoucherValidationResult>.Failure(
                    $"Voucher sàn '{code}' yêu cầu đơn tối thiểu {voucher.MinOrderValue:N0}đ", EErrorCode.InvalidInput);
            }

            // Pre-check nhanh UsageCount
            if (voucher.UsageCount >= voucher.MaxUsageCount)
            {
                return Result<VoucherValidationResult>.Failure(
                    $"Voucher sàn '{code}' đã hết lượt sử dụng", EErrorCode.InvalidInput);
            }

            // Per-user check — 1 query duy nhất
            var userUsageCount = await voucherUsageRepo.CountAsync(
                u => u.VoucherId == voucher.Id && u.UserId == customerId, cancellationToken);

            if (userUsageCount >= voucher.MaxUsagePerUser)
            {
                return Result<VoucherValidationResult>.Failure(
                    $"Bạn đã đạt giới hạn sử dụng voucher sàn '{code}'", EErrorCode.InvalidInput);
            }

            decimal discount = CalculateDiscount(voucher, totalOrderSubtotal);

            result.PlatformDiscount = discount;
            result.PlatformVoucher = voucher;
        }

        return Result<VoucherValidationResult>.Success(result);
    }

    private static decimal CalculateDiscount(Voucher voucher, decimal subtotal)
    {
        if (voucher.DiscountType == DiscountType.Percentage)
        {
            var discount = Math.Round(subtotal * voucher.DiscountValue / 100, 2);
            if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value)
                discount = voucher.MaxDiscountAmount.Value;
            return discount;
        }

        return Math.Min(voucher.DiscountValue, subtotal);
    }
}
