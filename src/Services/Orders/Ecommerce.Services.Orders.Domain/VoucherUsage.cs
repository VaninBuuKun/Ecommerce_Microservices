using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

public class VoucherUsage : EntityBase<Guid>
{
    public long VoucherId { get; set; }
    public long UserId { get; set; }
    public long? OrderId { get; set; }   
    public long? SubOrderId { get; set; }
    public decimal DiscountAmount { get; set; } //Số tiền đã giảm thực tế.
    public DateTimeOffset UsedAt { get; set; }

    public Voucher Voucher { get; set; }
}
