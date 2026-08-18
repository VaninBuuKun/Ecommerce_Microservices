using System;
using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class WithdrawalRequest : EntityTrackingBase<Guid>
{
    public Guid WalletId { get; set; }
    public long UserId { get; set; }
    public decimal Amount { get; set; }
    public Guid BankAccountId { get; set; }

    // Snapshot thông tin tài khoản ngân hàng lúc rút
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;

    public WithdrawalStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public string? ProofImageUrl { get; set; }
    public long? ProcessedByAdminId { get; set; }
    public DateTime? ProcessedAt { get; set; }

    // Navigation property
    public virtual Wallet Wallet { get; set; } = null!;
}
