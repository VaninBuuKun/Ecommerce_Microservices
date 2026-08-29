namespace Ecommerce.Services.Payments.Api.Models.Settings;

public class VNPaySettings
{
    public string TmnCode { get; set; } = string.Empty;
    public string HashSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string RedirectUrl { get; set;  } = string.Empty;
}
