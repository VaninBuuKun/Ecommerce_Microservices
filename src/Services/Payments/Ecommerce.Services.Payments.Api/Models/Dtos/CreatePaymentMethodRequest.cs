namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreatePaymentMethodRequest
{
    public string Title { get; set; } = null!;
    public string? SubTitle { get; set; } = null!;
    public bool IsActive { get; set; } = false;
    public string ProviderName { get; set; } = null!;
    public string IconUrl { get; set; } = null!;
    public decimal? MinAmount { get; set; }
}
