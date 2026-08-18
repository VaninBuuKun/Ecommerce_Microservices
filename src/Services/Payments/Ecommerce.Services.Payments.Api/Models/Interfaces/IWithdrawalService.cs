using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IWithdrawalService
{
    Task<Result<WithdrawalRequestDto>> CreateWithdrawal(long userId, CreateWithdrawalRequest request);
    Task<Result<List<WithdrawalRequestDto>>> GetMyWithdrawals(long userId);
    Task<Result<List<WithdrawalRequestDto>>> GetAllWithdrawals(string? status);
    Task<Result> ApproveWithdrawal(Guid id, long adminId);
    Task<Result> CompleteWithdrawal(Guid id, long adminId, CompleteWithdrawalRequest request);
    Task<Result> RejectWithdrawal(Guid id, long adminId, AdminRejectWithdrawalRequest request);
}
