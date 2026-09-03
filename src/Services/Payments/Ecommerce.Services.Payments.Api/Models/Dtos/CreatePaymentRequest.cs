using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreatePaymentRequest
{
    public long OrderId {get; set;}
    public decimal Amount {get; set;}
    public string Currency { get; set; } = "VND";
    public string MethodProvider { get; set; }
    public PaymentType PaymentType { get; set; }
}
