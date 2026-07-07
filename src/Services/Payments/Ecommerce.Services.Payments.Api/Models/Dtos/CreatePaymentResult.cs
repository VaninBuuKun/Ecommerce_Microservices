namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreatePaymentResult
{ 
    public bool Success {get; set;}
    public string? ErrorMessage {get; set;}
}