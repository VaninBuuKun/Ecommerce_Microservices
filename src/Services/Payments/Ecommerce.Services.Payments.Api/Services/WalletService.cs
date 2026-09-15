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
    private readonly IGenericEfRepository<Wallet, long> _walletRepository = unitOfWork.Repository<Wallet, long>();
    private readonly IGenericEfRepository<BankAccount, long> _bankAccountRepository = unitOfWork.Repository<BankAccount, long>();
    private readonly IGenericEfRepository<WalletTransaction, Guid> _transactionRepository = unitOfWork.Repository<WalletTransaction, Guid>();

    public record SupportedBankInfo(string Name, string Code, string IconUrl);

    public static readonly Dictionary<string, SupportedBankInfo> AllowedBanks =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Vietcombank"] = new(
                "Vietcombank",
                "VCB",
                "https://api.vietqr.io/img/VCB.png"),

            ["Techcombank"] = new(
                "Techcombank",
                "TCB",
                "https://api.vietqr.io/img/TCB.png"),

            ["MB Bank"] = new(
                "MB Bank",
                "MB",
                "https://api.vietqr.io/img/MB.png"),

            ["ACB"] = new(
                "ACB",
                "ACB",
                "https://api.vietqr.io/img/ACB.png"),

            ["BIDV"] = new(
                "BIDV",
                "BIDV",
                "https://api.vietqr.io/img/BIDV.png"),

            ["VietinBank"] = new(
                "VietinBank",
                "ICB",
                "https://api.vietqr.io/img/ICB.png"),

            ["Agribank"] = new(
                "Agribank",
                "VBA",
                "https://api.vietqr.io/img/VBA.png"),

            ["Sacombank"] = new(
                "Sacombank",
                "STB",
                "https://api.vietqr.io/img/STB.png"),

            ["VPBank"] = new(
                "VPBank",
                "VPB",
                "https://api.vietqr.io/img/VPB.png"),

            ["TPBank"] = new(
                "TPBank",
                "TPB",
                "https://api.vietqr.io/img/TPB.png"),

            ["VIB"] = new(
                "VIB",
                "VIB",
                "https://api.vietqr.io/img/VIB.png"),

            ["HDBank"] = new(
                "HDBank",
                "HDB",
                "https://api.vietqr.io/img/HDB.png"),
        };

    public static string GetBankIconUrl(string? bankName)
    {
        if (string.IsNullOrWhiteSpace(bankName)) return string.Empty;
        return AllowedBanks.TryGetValue(bankName.Trim(), out var info) ? info.IconUrl : string.Empty;
    }

    private static Result ValidateBankRequest(string bankName, string accountNumber, string accountHolder)
    {
        if (string.IsNullOrWhiteSpace(bankName) || string.IsNullOrWhiteSpace(accountNumber) || string.IsNullOrWhiteSpace(accountHolder))
        {
            return Result.Failure("Thông tin tài khoản ngân hàng liên kết không được để trống.", EErrorCode.ValidationErrors);
        }

        if (!AllowedBanks.ContainsKey(bankName.Trim()))
        {
            return Result.Failure($"Ngân hàng '{bankName}' không nằm trong danh sách hỗ trợ của hệ thống.", EErrorCode.ValidationErrors);
        }

        if (!System.Text.RegularExpressions.Regex.IsMatch(accountHolder.Trim().ToUpper(), @"^[A-Z0-9 ]+$"))
        {
            return Result.Failure("Tên chủ tài khoản phải viết hoa không dấu và không chứa ký tự đặc biệt (ví dụ: NGUYEN VAN A).", EErrorCode.ValidationErrors);
        }

        if (!System.Text.RegularExpressions.Regex.IsMatch(accountNumber.Trim(), @"^[0-9]{8,15}$"))
        {
            return Result.Failure("Số tài khoản ngân hàng phải là chuỗi số có độ dài từ 8 đến 15 chữ số.", EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result<WalletDto>> ActivateWallet(long userId, ActivateWalletRequest request)
    {
        var existingWallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (existingWallet != null)
        {
            return Result<WalletDto>.Failure("Ví điện tử của bạn đã được kích hoạt trước đó.", EErrorCode.RecordAlreadyExists);
        }

        var validationResult = ValidateBankRequest(request.BankName, request.BankAccountNumber, request.BankAccountHolder);
        if (!validationResult.IsSuccess)
        {
            return Result<WalletDto>.Failure(validationResult.Message, EErrorCode.ValidationErrors);
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

        var validationResult = ValidateBankRequest(request.BankName, request.BankAccountNumber, request.BankAccountHolder);
        if (!validationResult.IsSuccess)
        {
            return Result<BankAccountDto>.Failure(validationResult.Message, EErrorCode.ValidationErrors);
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
        dto.IconUrl = GetBankIconUrl(bankAccount.BankName);
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
        var dtos = accounts.Select(b =>
        {
            var dto = mapper.Map<BankAccountDto>(b);
            dto.IconUrl = GetBankIconUrl(b.BankName);
            return dto;
        }).ToList();
        return Result<List<BankAccountDto>>.Success(dtos);
    }

    public async Task<Result<BankAccountDto>> UpdateBankAccount(long userId, long bankAccountId, AddBankAccountRequest request)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<BankAccountDto>.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        var bankAccount = await _bankAccountRepository.FirstOrDefaultAsync(b => b.Id == bankAccountId && b.WalletId == wallet.Id);
        if (bankAccount == null)
        {
            return Result<BankAccountDto>.Failure("Tài khoản ngân hàng không tồn tại hoặc không thuộc ví của bạn.", EErrorCode.NotFound);
        }

        var validationResult = ValidateBankRequest(request.BankName, request.BankAccountNumber, request.BankAccountHolder);
        if (!validationResult.IsSuccess)
        {
            return Result<BankAccountDto>.Failure(validationResult.Message, EErrorCode.ValidationErrors);
        }

        if (request.IsDefault && !bankAccount.IsDefault)
        {
            // Reset các tài khoản mặc định cũ của ví này
            var defaults = await _bankAccountRepository.GetAllAsync(b => b.WalletId == wallet.Id && b.IsDefault);
            foreach (var oldDefault in defaults)
            {
                oldDefault.IsDefault = false;
                _bankAccountRepository.Update(oldDefault);
            }
        }

        bankAccount.BankName = request.BankName.Trim();
        bankAccount.BankAccountNumber = request.BankAccountNumber.Trim();
        bankAccount.BankAccountHolder = request.BankAccountHolder.Trim().ToUpper();
        bankAccount.IsDefault = request.IsDefault;

        _bankAccountRepository.Update(bankAccount);
        await unitOfWork.SaveChangesAsync();

        var dto = mapper.Map<BankAccountDto>(bankAccount);
        dto.IconUrl = GetBankIconUrl(bankAccount.BankName);
        return Result<BankAccountDto>.Success(dto);
    }

    public async Task<Result> DeleteBankAccount(long userId, long bankAccountId)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result.Failure("Ví điện tử chưa được kích hoạt.", EErrorCode.NotFound);
        }

        var accounts = await _bankAccountRepository.GetAllAsync(b => b.WalletId == wallet.Id);
        var bankAccount = accounts.FirstOrDefault(b => b.Id == bankAccountId);
        if (bankAccount == null)
        {
            return Result.Failure("Tài khoản ngân hàng không tồn tại hoặc không thuộc ví của bạn.", EErrorCode.NotFound);
        }

        if (accounts.Count <= 1)
        {
            return Result.Failure("Không thể xóa tài khoản ngân hàng duy nhất. Vui lòng thêm tài khoản ngân hàng mới trước khi xóa.", EErrorCode.ValidationErrors);
        }

        bool wasDefault = bankAccount.IsDefault;
        _bankAccountRepository.Delete(bankAccount);

        // Nếu xóa tài khoản mặc định, tự động chuyển một tài khoản còn lại thành mặc định
        if (wasDefault)
        {
            var nextAccount = accounts.FirstOrDefault(b => b.Id != bankAccountId);
            if (nextAccount != null)
            {
                nextAccount.IsDefault = true;
                _bankAccountRepository.Update(nextAccount);
            }
        }

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
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

    public async Task<Result> ProcessRefundAsync(long customerId, object refundRequestId, decimal amount, Ecommerce.Services.Payments.Api.Models.Enums.TransactionReason reason, string description)
    {
        var refStr = refundRequestId.ToString();
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
        var existingTx = await _transactionRepository.FirstOrDefaultAsync(t => t.WalletId == wallet.Id && t.ReferenceId == refStr && t.Type == TransactionType.Credit);
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
            ReferenceId = refStr,
            Description = description
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DebitWalletAsync(long userId, object referenceId, decimal amount, TransactionReason reason, string description)
    {
        var refStr = referenceId.ToString();
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result.Failure($"Không tìm thấy ví của người dùng {userId} để thực hiện trừ tiền hoàn trả.", EErrorCode.NotFound);
        }

        // Chống trùng lặp (Idempotency)
        var existingTx = await _transactionRepository.FirstOrDefaultAsync(t => t.WalletId == wallet.Id && t.ReferenceId == refStr && t.Type == TransactionType.Debit);
        if (existingTx != null)
        {
            return Result.Success(); 
        }

        wallet.Balance -= amount;
        _walletRepository.Update(wallet);

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = amount,
            Type = TransactionType.Debit,
            Reason = reason,
            BalanceAfter = wallet.Balance,
            ReferenceId = refStr,
            Description = description
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> CreditWalletAsync(long userId, object referenceId, decimal amount, TransactionReason reason, string description)
    {
        var refStr = referenceId.ToString();
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = userId,
                Balance = 0m,
                IsLocked = false
            };
            _walletRepository.Add(wallet);
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
            ReferenceId = refStr,
            Description = description
        };
        _transactionRepository.Add(transaction);

        await unitOfWork.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<List<WalletTransactionDto>>> GetAllTransactions()
    {
        var transactions = await _transactionRepository.GetAllAsync();
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

    public async Task<Result<SellerRevenueReportDto>> GetSellerRevenueReport(long userId)
    {
        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Result<SellerRevenueReportDto>.Success(new SellerRevenueReportDto(0m, 0m, 0m, 0, new List<DailyRevenueDto>()));
        }

        var transactions = await _transactionRepository.GetAllAsync(t => t.WalletId == wallet.Id && t.Type == TransactionType.Credit);
        var totalRevenue = transactions.Sum(t => t.Amount);
        var totalCompletedOrders = transactions.Count;

        // Group by Date for 7-day revenue chart
        var dailyRevenues = transactions
            .GroupBy(t => t.CreatedDate.ToString("yyyy-MM-dd"))
            .Select(g => new DailyRevenueDto(
                Date: g.Key,
                Revenue: g.Sum(x => x.Amount),
                OrderCount: g.Count()
            ))
            .OrderBy(d => d.Date)
            .ToList();

        var report = new SellerRevenueReportDto(
            TotalRevenue: totalRevenue,
            AvailableBalance: wallet.Balance,
            FrozenBalance: 0m,
            TotalCompletedOrders: totalCompletedOrders,
            DailyRevenues: dailyRevenues
        );

        return Result<SellerRevenueReportDto>.Success(report);
    }

    public Task<Result<List<SupportedBankDto>>> GetSupportedBanks()
    {
        var list = AllowedBanks.Values.Select(b => new SupportedBankDto
        {
            Name = b.Name,
            Code = b.Code,
            IconUrl = b.IconUrl
        }).ToList();

        return Task.FromResult(Result<List<SupportedBankDto>>.Success(list));
    }
}
