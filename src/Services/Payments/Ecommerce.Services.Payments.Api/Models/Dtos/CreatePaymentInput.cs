using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreatePaymentInput
{
    public Guid TargetId {get; set;}
    public decimal Amount {get; set;}
    private string Currency { get; set; } = "VND";
    public long MethodId { get; set; }
    public PaymentType PaymentType { get; set; }
}