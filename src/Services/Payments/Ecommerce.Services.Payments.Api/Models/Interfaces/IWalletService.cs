using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Enums;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IWalletService
{
    Task<Result<WalletDto>> ActivateWallet(long userId, ActivateWalletRequest request);
    Task<Result<WalletDto>> GetWalletByUserId(long userId);
    Task<Result<BankAccountDto>> AddBankAccount(long userId, AddBankAccountRequest request);
    Task<Result<List<BankAccountDto>>> GetBankAccounts(long userId);
    Task<Result<BankAccountDto>> UpdateBankAccount(long userId, long bankAccountId, AddBankAccountRequest request);
    Task<Result<List<WalletTransactionDto>>> GetWalletTransactions(long userId);
    Task<Result> ProcessRefundAsync(long customerId, object referenceId, decimal amount, Ecommerce.Services.Payments.Api.Models.Enums.TransactionReason reason, string description);
    Task<Result> DebitWalletAsync(long userId, object referenceId, decimal amount, TransactionReason reason, string description);
    Task<Result> CreditWalletAsync(long userId, object referenceId, decimal amount, TransactionReason reason, string description);
    Task<Result<List<WalletTransactionDto>>> GetAllTransactions();
    Task<Result<SellerRevenueReportDto>> GetSellerRevenueReport(long userId);
}
