using Ecommerce.Services.Payments.Api.Models.Entities;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class PaymentMothodDto
{
    public string Title { get; set; }
    public string? SubTitle { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public bool IsActive { get; set; }
    public string ProviderName { get; set; }
    public string IconUrl  { get; set; } 
}