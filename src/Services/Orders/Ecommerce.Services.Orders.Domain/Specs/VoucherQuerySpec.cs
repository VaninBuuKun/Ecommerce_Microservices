using Ardalis.Specification;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Domain.Specs;

public class VoucherQuerySpec : Specification<Voucher>
{
    public VoucherQuerySpec(string? code, int page, int pageSize, DiscountType? discountType, bool? UsageLimit, DateTimeOffset? startDate, DateTimeOffset? endDate, bool? isActive, long? shopId)
    {
        Query.Where(voucher => (string.IsNullOrEmpty(code) || voucher.Code.Contains(code)) &&
                               (!discountType.HasValue || voucher.DiscountType == discountType) &&
                               (!UsageLimit.HasValue || (UsageLimit.Value ? voucher.MaxUsageCount > 0 : voucher.MaxUsageCount == 0)) &&
                               (!startDate.HasValue || voucher.StartDate >= startDate.Value) &&
                               (!endDate.HasValue || voucher.EndDate <= endDate.Value) &&
                               (!isActive.HasValue || voucher.IsActive == isActive.Value) &&
                                (shopId.HasValue ? voucher.ShopId == shopId.Value && voucher.Scope == VoucherScope.Shop : voucher.Scope == VoucherScope.Platform))
             .Skip((page - 1) * pageSize)
             .Take(pageSize);
    }
}