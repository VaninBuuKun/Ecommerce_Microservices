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
public class AdminWithdrawalController(IWithdrawalService withdrawalService, ICurrentUserService currentUserService) : ControllerBase
{
    private long AdminId => currentUserService.UserId;

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

        [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> CompleteWithdrawal(Guid id)
    {
        var result = await withdrawalService.CompleteWithdrawal(id, AdminId);

        if (result.IsSuccess)
        {
            return Ok(new { Message = "Xác nhận yêu cầu rút tiền thành công." });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

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
