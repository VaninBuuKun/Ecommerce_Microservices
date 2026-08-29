using System.Text.Json.Serialization;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreatePaymentResult
{ 
    public bool Success {get; set;}
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorMessage {get; set;}
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PaymentUrl {get; set;}
}
