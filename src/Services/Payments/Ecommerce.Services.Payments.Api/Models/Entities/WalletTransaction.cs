using System;
using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class WalletTransaction : EntityTrackingBase<Guid>
{
    public long WalletId { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public TransactionReason Reason { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceId { get; set; }           // ID tham chiếu (SubOrderId, WithdrawalId...)
    public string? Description { get; set; }

    // Navigation property
    public virtual Wallet Wallet { get; set; } = null!;
}
