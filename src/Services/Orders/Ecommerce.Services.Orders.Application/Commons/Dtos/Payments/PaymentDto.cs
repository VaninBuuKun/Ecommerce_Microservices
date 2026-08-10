namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;

public class PaymentDto
{
    public Guid Id { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}