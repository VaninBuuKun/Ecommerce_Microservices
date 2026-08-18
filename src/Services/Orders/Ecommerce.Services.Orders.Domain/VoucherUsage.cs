using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

public class VoucherUsage : EntityBase<Guid>
{
    public Guid VoucherId { get; set; }
    public long UserId { get; set; }
    public Guid? OrderId { get; set; }   
    public Guid? SubOrderId { get; set; }
    public decimal DiscountAmount { get; set; } //Số tiền đã giảm thực tế.
    public DateTimeOffset UsedAt { get; set; }

    public Voucher Voucher { get; set; }
}
