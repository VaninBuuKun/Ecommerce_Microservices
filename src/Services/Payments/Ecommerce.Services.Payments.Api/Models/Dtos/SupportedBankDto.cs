namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class SupportedBankDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
}
