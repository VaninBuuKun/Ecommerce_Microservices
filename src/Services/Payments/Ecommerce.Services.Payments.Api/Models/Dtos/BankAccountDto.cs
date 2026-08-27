using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class BankAccountDto
{
    public long Id { get; set; }
    public long WalletId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
