using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class BankAccountDto
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
