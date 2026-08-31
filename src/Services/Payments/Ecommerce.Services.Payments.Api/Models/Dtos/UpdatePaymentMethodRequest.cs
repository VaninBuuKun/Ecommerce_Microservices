namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class UpdatePaymentMethodRequest
{
    public string Title { get; set; } = null!;
    public string? SubTitle { get; set; }
    public bool IsActive { get; set; }
    public string ProviderName { get; set; } = null!;
    public string IconUrl { get; set; } = null!;
}
