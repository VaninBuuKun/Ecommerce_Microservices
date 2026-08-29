using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Services;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KycController(IKycService kycService, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("my-kyc")]
    [Authorize]
    public async Task<IActionResult> GetMyKyc()
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await kycService.GetKycByOwnerIdAsync(currentUserService.UserId);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPost("register")]
    [Authorize]
    public async Task<IActionResult> RegisterKyc([FromBody] RegisterKycRequest request)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var submitReq = new SubmitKycRequest(
            request.FullName ?? "Chưa đặt tên",
            request.IdentityCardNumber,
            request.IdentityCardFrontUrl,
            request.IdentityCardBackUrl,
            request.TaxNumber ?? ""
        );

        var result = await kycService.SubmitKycAsync(currentUserService.UserId, submitReq);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPut("{id:long}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveKyc(long id)
    {
        var adminUserId = currentUserService.IsAuthenticated ? currentUserService.UserId : 1L;
        var result = await kycService.ApproveKycAsync(id, adminUserId);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Duyệt yêu cầu xác minh thành công.");
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectKyc(long id, [FromBody] RejectKycRequest request)
    {
        var result = await kycService.RejectKycAsync(id, request.Reason);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Từ chối hồ sơ xác minh thành công.");
    }

    [HttpGet("admin/list")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminKycs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] KycStatus? status = null)
    {
        var result = await kycService.GetAdminKycsAsync(page, pageSize, status);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }
}

public record RejectKycRequest(string Reason);

public record RegisterKycRequest(
    string? FullName,
    string IdentityCardNumber,
    string IdentityCardFrontUrl,
    string IdentityCardBackUrl,
    string? TaxNumber,
    bool IsDraft = false);
