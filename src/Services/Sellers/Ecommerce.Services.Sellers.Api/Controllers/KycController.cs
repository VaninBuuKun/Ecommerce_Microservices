using System;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.ApproveKyc;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.RegisterKyc;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.WithdrawKycDraft;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Queries.GetMyKyc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KycController(ISender sender, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("my-kyc")]
    [Authorize]
    public async Task<IActionResult> GetMyKyc()
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await sender.Send(new GetMyKycQuery(currentUserService.UserId));
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

        var result = await sender.Send(new RegisterKycCommand(
            currentUserService.UserId,
            request.IdentityCardNumber,
            request.IdentityCardFrontUrl,
            request.IdentityCardBackUrl,
            request.IsDraft));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPut("withdraw-draft")]
    [Authorize]
    public async Task<IActionResult> WithdrawKycDraft()
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await sender.Send(new WithdrawKycDraftCommand(currentUserService.UserId));
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
        var result = await sender.Send(new ApproveKycCommand(id));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Duyệt yêu cầu xác minh thành công.");
    }
}

public record RegisterKycRequest(
    string IdentityCardNumber,
    string IdentityCardFrontUrl,
    string IdentityCardBackUrl,
    bool IsDraft = false);
