using System.ComponentModel.DataAnnotations;
using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Domain;

public class Voucher : EntityTrackingBase<long>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public VoucherScope Scope { get; set; }
    public decimal MinOrderValue  { get; set; }
    public long MaxUsageCount { get; set; }
    [ConcurrencyCheck]
    public long UsageCount { get; set; }
    public long MaxUsagePerUser { get; set; } = 1;
    public decimal? MaxDiscountAmount { get; set; }
    public long? ShopId { get; set; }
    
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public bool IsActive { get; set; }
    public long? CreatedByUserId { get; set; }
}
