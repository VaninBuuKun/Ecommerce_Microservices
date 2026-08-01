using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class Wallet : EntityTrackingBase<Guid>
{
    public long UserId { get; set; }           // ID của user bên Identity
    public decimal Balance { get; set; }        // Số dư khả dụng
    public bool IsLocked { get; set; }          // Trạng thái khóa ví

    // Navigation property
    public virtual ICollection<BankAccount> BankAccounts { get; set; } = new List<BankAccount>();
    public virtual ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
    public virtual ICollection<WithdrawalRequest> WithdrawalRequests { get; set; } = new List<WithdrawalRequest>();
}
