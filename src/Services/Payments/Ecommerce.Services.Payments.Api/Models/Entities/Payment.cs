using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

//Mục đích là để quản lý payment cho order(cửa ngõ), mặc định lưu thanh toán cho order.
public class Payment : EntityTrackingBase<Guid>
{
    public decimal Amount { get; set; }
    public long OrderId { get; set; }
    public PaymentStatus Status { get; set; }
    public long MethodId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? PaymentUrl { get; set; }
    
    public PaymentMethod Method { get; set; }
}