using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

public class VoucherDto
{
    public Guid VoucherId { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public VoucherScope Scope { get; set; }
    public decimal MinOrderValue  { get; set; }
    public long MaxUsageCount { get; set; }
    public long MaxUsagePerUser { get; set; }
    public long? ShopId { get; set; }
    
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public bool IsActive { get; set; }
    public long? CreatedByUserId { get; set; }
}