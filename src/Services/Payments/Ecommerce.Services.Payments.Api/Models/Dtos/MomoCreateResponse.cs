namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class MomoCreateResponse
{
    public int ResultCode { get; set; }
    public string? Message { get; set; }
    public string? PayUrl { get; set; }  
    public string? OrderId { get; set; }
}