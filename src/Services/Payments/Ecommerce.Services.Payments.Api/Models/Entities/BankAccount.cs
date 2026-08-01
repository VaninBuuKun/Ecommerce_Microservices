using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class BankAccount : EntityTrackingBase<Guid>
{
    public Guid WalletId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public bool IsDefault { get; set; }

    // Navigation property
    public virtual Wallet Wallet { get; set; } = null!;
}
