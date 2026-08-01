using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MapsterMapper;

namespace Ecommerce.Services.Payments.Api.Services;

public class WalletService(IEfUnitOfWork unitOfWork, IMapper mapper) : IWalletService
{
    private readonly IGenericEfRepository<Wallet, Guid> _walletRepository = unitOfWork.Repository<Wallet, Guid>();
    private readonly IGenericEfRepository<BankAccount, Guid> _bankAccountRepository = unitOfWork.Repository<BankAccount, Guid>();
    private readonly IGenericEfRepository<WalletTransaction, Guid> _transactionRepository = unitOfWork.Repository<WalletTransaction, Guid>();

    public async Task<Result<WalletDto>> ActivateWallet(long userId, ActivateWalletRequest request)
    {
        var existingWallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (existingWallet != null)
        {
            return Result<WalletDto>.Failure("Ví điện tử của bạn đã được kích hoạt trước đó.", EErrorCode.RecordAlreadyExists);
        }

        if (string.IsNullOrWhiteSpace(request.BankName) || 
            string.IsNullOrWhiteSpace(request.BankAccountNumber) || 
            string.IsNullOrWhiteSpace(request.BankAccountHolder))
        {
            return Result<WalletDto>.Failure("Thông tin tài khoản ngân hàng liên kết không được để trống.", EErrorCode.ValidationErrors);
        }

        var wallet = new Wallet
        {
            UserId = userId,
            Balance = 0m,
            IsLocked = false
        };
        _walletRepository.Add(wallet);

        var bankAccount = new BankAccount
        {
            WalletId = wallet.Id,
            BankName = request.BankName.Trim(),
            BankAccountNumber = request.BankAccountNumber.Trim(),
            BankAccountHolder = request.BankAccountHolder.Trim().ToUpper(),
            IsDefault = true,
            Wallet = wallet
        };
        _bankAccountRepository.Add(bankAccount);

        await unitOfWork.SaveChangesAsync();

        var walletDto = mapper.Map<WalletDto>(wallet);
        return Result<WalletDto>.Success(walletDto);
    }

    public async Task<Result<WalletDto>> GetWalletByUserId(long userId)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<WalletDto>.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        var walletDto = mapper.Map<WalletDto>(wallet);
        return Result<WalletDto>.Success(walletDto);
    }

    public async Task<Result<BankAccountDto>> AddBankAccount(long userId, AddBankAccountRequest request)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<BankAccountDto>.Failure("Ví điện tử chưa được kích hoạt. Vui lòng kích hoạt ví trước.", EErrorCode.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.BankName) || 
            string.IsNullOrWhiteSpace(request.BankAccountNumber) || 
            string.IsNullOrWhiteSpace(request.BankAccountHolder))
        {
            return Result<BankAccountDto>.Failure("Thông tin tài khoản ngân hàng không hợp lệ.", EErrorCode.ValidationErrors);
        }

        if (request.IsDefault)
        {
            // Reset các tài khoản mặc định cũ của ví này
            var defaults = await _bankAccountRepository.GetAllAsync(b => b.WalletId == wallet.Id && b.IsDefault);
            foreach (var oldDefault in defaults)
            {
                oldDefault.IsDefault = false;
                _bankAccountRepository.Update(oldDefault);
            }
        }

        var bankAccount = new BankAccount
        {
            WalletId = wallet.Id,
            BankName = request.BankName.Trim(),
            BankAccountNumber = request.BankAccountNumber.Trim(),
            BankAccountHolder = request.BankAccountHolder.Trim().ToUpper(),
            IsDefault = request.IsDefault
        };
        _bankAccountRepository.Add(bankAccount);

        await unitOfWork.SaveChangesAsync();

        var dto = mapper.Map<BankAccountDto>(bankAccount);
        return Result<BankAccountDto>.Success(dto);
    }

    public async Task<Result<List<BankAccountDto>>> GetBankAccounts(long userId)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<List<BankAccountDto>>.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        var accounts = await _bankAccountRepository.GetAllAsync(b => b.WalletId == wallet.Id);
        var dtos = mapper.Map<List<BankAccountDto>>(accounts);
        return Result<List<BankAccountDto>>.Success(dtos);
    }

    public async Task<Result<List<WalletTransactionDto>>> GetWalletTransactions(long userId)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<List<WalletTransactionDto>>.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        // Lấy tất cả giao dịch sắp xếp theo CreatedDate mới nhất
        var transactions = await _transactionRepository.GetAllAsync(t => t.WalletId == wallet.Id);
        var orderedTransactions = transactions.OrderByDescending(t => t.CreatedDate).ToList();

        var dtos = orderedTransactions.Select(t => new WalletTransactionDto
        {
            Id = t.Id,
            WalletId = t.WalletId,
            Amount = t.Amount,
            Type = t.Type.ToString(),
            Reason = t.Reason.ToString(),
            BalanceAfter = t.BalanceAfter,
            ReferenceId = t.ReferenceId,
            Description = t.Description,
            CreatedDate = t.CreatedDate
        }).ToList();

        return Result<List<WalletTransactionDto>>.Success(dtos);
    }

    public async Task<Result> ProcessRefundAsync(long customerId, Guid refundRequestId, decimal amount, Ecommerce.Services.Payments.Api.Models.Enums.TransactionReason reason, string description)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == customerId);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = customerId,
                Balance = 0m,
                IsLocked = false
            };
            _walletRepository.Add(wallet);
        }

        // Chống hoàn tiền trùng lặp (Idempotency)
        var existingTx = await _transactionRepository.FirstOrDefaultAsync(t => t.WalletId == wallet.Id && t.ReferenceId == refundRequestId && t.Type == TransactionType.Credit);
        if (existingTx != null)
        {
            return Result.Success(); // Đã hoàn tiền trước đó, bỏ qua để tránh double refund
        }

        wallet.Balance += amount;
        _walletRepository.Update(wallet);

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = amount,
            Type = TransactionType.Credit,
            Reason = reason,
            BalanceAfter = wallet.Balance,
            ReferenceId = refundRequestId,
            Description = description
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }
}
