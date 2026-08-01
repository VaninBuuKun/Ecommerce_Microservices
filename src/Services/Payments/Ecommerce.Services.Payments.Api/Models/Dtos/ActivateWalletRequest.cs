namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class ActivateWalletRequest
{
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
}
