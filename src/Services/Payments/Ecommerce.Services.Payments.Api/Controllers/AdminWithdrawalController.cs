using System;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/admin/withdrawals")]
[Authorize] // Có thể thêm [Authorize(Roles = "Admin")] nếu hệ thống phân quyền của Identity Server đã gán role Admin
public class AdminWithdrawalController(
    IWithdrawalService withdrawalService, 
    IWalletService walletService,
    ICurrentUserService currentUserService) : ControllerBase
{
    private long AdminId => currentUserService.UserId;

    [HttpGet("/api/admin/wallets/transactions")]
    public async Task<IActionResult> GetAllTransactions()
    {
        var result = await walletService.GetAllTransactions();

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllWithdrawals([FromQuery] string? status)
    {
        var result = await withdrawalService.GetAllWithdrawals(status);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> ApproveWithdrawal(Guid id)
    {
        var result = await withdrawalService.ApproveWithdrawal(id, AdminId);

        if (result.IsSuccess)
        {
            return Ok(new { Message = "Phê duyệt yêu cầu rút tiền thành công. Trạng thái đã chuyển sang Approved." });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> CompleteWithdrawal(Guid id, [FromBody] CompleteWithdrawalRequest request)
    {
        var result = await withdrawalService.CompleteWithdrawal(id, AdminId, request);

        if (result.IsSuccess)
        {
            return Ok(new { Message = "Xác nhận đã chuyển khoản thành công." });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [Authorize]
    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> RejectWithdrawal(Guid id, [FromBody] AdminRejectWithdrawalRequest request)
    {
        var result = await withdrawalService.RejectWithdrawal(id, AdminId, request);

        if (result.IsSuccess)
        {
            return Ok(new { Message = "Đã từ chối yêu cầu rút tiền. Tiền đã được hoàn lại ví của người dùng." });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
