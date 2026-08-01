using System;
using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Domain;

public class RefundRequest : EntityTrackingBase<Guid>
{
    public Guid SubOrderId { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? SellerNote { get; set; }
    public RefundStatus Status { get; set; }

    // Navigation property
    public virtual SubOrder SubOrder { get; set; } = null!;
}
