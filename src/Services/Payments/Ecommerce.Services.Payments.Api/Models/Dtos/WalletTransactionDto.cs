using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class WalletTransactionDto
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal BalanceAfter { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
