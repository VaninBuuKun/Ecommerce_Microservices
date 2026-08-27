using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class WithdrawalRequestDto
{
    public Guid Id { get; set; }
    public long WalletId { get; set; }
    public long UserId { get; set; }
    public decimal Amount { get; set; }
    public long BankAccountId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public long? ProcessedByAdminId { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
