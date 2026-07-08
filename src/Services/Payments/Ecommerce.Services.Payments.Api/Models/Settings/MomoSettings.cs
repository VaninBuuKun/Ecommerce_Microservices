namespace Ecommerce.Services.Payments.Api.Models.Settings;

public class MomoSettings
{
    public string PartnerCode { get; set; } = null!;
    public string AccessKey { get; set; } = null!;
    public string SecretKey { get; set; } = null!;
    public string RedirectUrl { get; set; } = null!;
    public string IpnUrl { get; set; } = null!;
    public string BaseUrl { get; set; } = null!;
}