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

public class WithdrawalService(IEfUnitOfWork unitOfWork, IMapper mapper) : IWithdrawalService
{
    private readonly IGenericEfRepository<Wallet, long> _walletRepository = unitOfWork.Repository<Wallet, long>();
    private readonly IGenericEfRepository<BankAccount, long> _bankAccountRepository = unitOfWork.Repository<BankAccount, long>();
    private readonly IGenericEfRepository<WalletTransaction, Guid> _transactionRepository = unitOfWork.Repository<WalletTransaction, Guid>();
    private readonly IGenericEfRepository<WithdrawalRequest, Guid> _withdrawalRepository = unitOfWork.Repository<WithdrawalRequest, Guid>();

    public async Task<Result<WithdrawalRequestDto>> CreateWithdrawal(long userId, CreateWithdrawalRequest request)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<WithdrawalRequestDto>.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        if (wallet.IsLocked)
        {
            return Result<WithdrawalRequestDto>.Failure("Ví điện tử của bạn đang bị khóa. Không thể thực hiện rút tiền.", EErrorCode.Forbidden);
        }

        if (request.Amount <= 0)
        {
            return Result<WithdrawalRequestDto>.Failure("Số tiền rút phải lớn hơn 0.", EErrorCode.ValidationErrors);
        }

        if (wallet.Balance < request.Amount)
        {
            return Result<WithdrawalRequestDto>.Failure("Số dư trong ví không đủ để thực hiện yêu cầu này.", EErrorCode.ValidationErrors);
        }

        var bankAccount = await _bankAccountRepository.FirstOrDefaultAsync(b => b.Id == request.BankAccountId && b.WalletId == wallet.Id);
        if (bankAccount == null)
        {
            return Result<WithdrawalRequestDto>.Failure("Tài khoản ngân hàng liên kết không tồn tại hoặc không hợp lệ.", EErrorCode.NotFound);
        }

        // 1. Tạo WithdrawalRequest
        var withdrawal = new WithdrawalRequest
        {
            WalletId = wallet.Id,
            UserId = userId,
            Amount = request.Amount,
            BankAccountId = bankAccount.Id,
            BankName = bankAccount.BankName,
            BankAccountNumber = bankAccount.BankAccountNumber,
            BankAccountHolder = bankAccount.BankAccountHolder,
            Status = WithdrawalStatus.Pending
        };
        _withdrawalRepository.Add(withdrawal);

        // 2. Trừ tiền số dư ví ngay lập tức (Hold tiền)
        wallet.Balance -= request.Amount;
        _walletRepository.Update(wallet);

        // 3. Ghi nhận giao dịch Debit (Hold)
        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = request.Amount,
            Type = TransactionType.Debit,
            Reason = TransactionReason.WithdrawalHold,
            BalanceAfter = wallet.Balance,
            ReferenceId = withdrawal.Id.ToString(),
            Description = $"Giữ tiền thực hiện yêu cầu rút về ngân hàng {withdrawal.BankName} ({withdrawal.BankAccountNumber})."
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();

        var dto = mapper.Map<WithdrawalRequestDto>(withdrawal);
        return Result<WithdrawalRequestDto>.Success(dto);
    }

    public async Task<Result<List<WithdrawalRequestDto>>> GetMyWithdrawals(long userId)
    {
        var withdrawals = await _withdrawalRepository.GetAllAsync(w => w.UserId == userId);
        var ordered = withdrawals.OrderByDescending(w => w.CreatedDate).ToList();
        var dtos = mapper.Map<List<WithdrawalRequestDto>>(ordered);
        return Result<List<WithdrawalRequestDto>>.Success(dtos);
    }

    public async Task<Result<List<WithdrawalRequestDto>>> GetAllWithdrawals(string? status)
    {
        List<WithdrawalRequest> withdrawals;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WithdrawalStatus>(status, true, out var filterStatus))
        {
            withdrawals = await _withdrawalRepository.GetAllAsync(w => w.Status == filterStatus);
        }
        else
        {
            withdrawals = await _withdrawalRepository.GetAllAsync();
        }

        var ordered = withdrawals.OrderByDescending(w => w.CreatedDate).ToList();
        var dtos = mapper.Map<List<WithdrawalRequestDto>>(ordered);
        return Result<List<WithdrawalRequestDto>>.Success(dtos);
    }

    public async Task<Result> ApproveWithdrawal(Guid id, long adminId)
    {
        var withdrawal = await _withdrawalRepository.GetByIdAsync(id);
        if (withdrawal == null)
        {
            return Result.Failure("Yêu cầu rút tiền không tồn tại.", EErrorCode.NotFound);
        }

        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            return Result.Failure("Yêu cầu rút tiền này đã được xử lý trước đó và không còn ở trạng thái chờ duyệt.", EErrorCode.ValidationErrors);
        }

        // Cập nhật trạng thái sang Approved
        withdrawal.Status = WithdrawalStatus.Approved;
        withdrawal.ProcessedAt = DateTime.UtcNow;
        withdrawal.ProcessedByAdminId = adminId;
        _withdrawalRepository.Update(withdrawal);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> CompleteWithdrawal(Guid id, long adminId, CompleteWithdrawalRequest request)
    {
        var withdrawal = await _withdrawalRepository.GetByIdAsync(id);
        if (withdrawal == null)
        {
            return Result.Failure("Yêu cầu rút tiền không tồn tại.", EErrorCode.NotFound);
        }

        if (withdrawal.Status != WithdrawalStatus.Pending && withdrawal.Status != WithdrawalStatus.Approved)
        {
            return Result.Failure("Yêu cầu rút tiền này đã được hoàn tất hoặc từ chối trước đó.", EErrorCode.ValidationErrors);
        }

        // Cập nhật trạng thái và thông tin chuyển khoản thực tế
        withdrawal.Status = WithdrawalStatus.Completed;
        withdrawal.AdminNote = request.AdminNote?.Trim();
        withdrawal.ProofImageUrl = request.ProofImageUrl?.Trim();
        withdrawal.ProcessedAt = DateTime.UtcNow;
        withdrawal.ProcessedByAdminId = adminId;
        _withdrawalRepository.Update(withdrawal);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> RejectWithdrawal(Guid id, long adminId, AdminRejectWithdrawalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AdminNote))
        {
            return Result.Failure("Lý do từ chối rút tiền không được để trống.", EErrorCode.ValidationErrors);
        }

        var withdrawal = await _withdrawalRepository.GetByIdAsync(id);
        if (withdrawal == null)
        {
            return Result.Failure("Yêu cầu rút tiền không tồn tại.", EErrorCode.NotFound);
        }

        // Hỗ trợ từ chối khi trạng thái đang là Pending hoặc Approved theo nghiệp vụ mới
        if (withdrawal.Status != WithdrawalStatus.Pending && withdrawal.Status != WithdrawalStatus.Approved)
        {
            return Result.Failure("Chỉ có thể từ chối các yêu cầu rút tiền đang chờ duyệt hoặc đã duyệt chờ thanh toán.", EErrorCode.ValidationErrors);
        }

        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.Id == withdrawal.WalletId);
        if (wallet == null)
        {
            return Result.Failure("Ví điện tử của người dùng không tồn tại.", EErrorCode.NotFound);
        }

        // 1. Cập nhật trạng thái sang Rejected
        withdrawal.Status = WithdrawalStatus.Rejected;
        withdrawal.AdminNote = request.AdminNote.Trim();
        withdrawal.ProcessedAt = DateTime.UtcNow;
        withdrawal.ProcessedByAdminId = adminId;
        _withdrawalRepository.Update(withdrawal);

        // 2. Cộng trả lại tiền cho User (Unhold)
        wallet.Balance += withdrawal.Amount;
        _walletRepository.Update(wallet);

        // 3. Tạo giao dịch Credit để ghi nhận hoàn tiền
        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = withdrawal.Amount,
            Type = TransactionType.Credit,
            Reason = TransactionReason.WithdrawalReject,
            BalanceAfter = wallet.Balance,
            ReferenceId = withdrawal.Id.ToString(),
            Description = $"Hoàn tiền yêu cầu rút {withdrawal.Id} bị từ chối. Lý do: {withdrawal.AdminNote}"
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }
}
