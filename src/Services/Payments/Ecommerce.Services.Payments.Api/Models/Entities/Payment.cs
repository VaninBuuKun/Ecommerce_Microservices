using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class Payment : EntityTrackingBase<Guid>
{
    public decimal Amount { get; set; }
    public Guid TargetId { get; set; } //OrderId, RefundId(PaymentId), etc
    
    public PaymentStatus Status { get; set; }
    public PaymentType Type { get; set; }
    public long MethodId { get; set; }
    
    public PaymentMethod Method { get; set; }
    public string? ErrorMessage { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? PaymentUrl { get; set; }
}