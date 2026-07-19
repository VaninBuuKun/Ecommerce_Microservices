using System;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.ApproveKyc;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.RegisterKyc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KycController(ISender sender, ICurrentUserService currentUserService) : ControllerBase
{
    // Đăng ký xác minh KYC làm người bán (Yêu cầu đăng nhập JWT)
    [HttpPost("register")]
    [Authorize]
    public async Task<IActionResult> RegisterKyc([FromBody] RegisterKycRequest request)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await sender.Send(new RegisterKycCommand(currentUserService.UserId, request.IdentityCardNumber));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    // Admin duyệt yêu cầu KYC
    [HttpPut("{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveKyc(Guid id)
    {
        var result = await sender.Send(new ApproveKycCommand(id));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Duyệt yêu cầu xác minh thành công.");
    }
}

public record RegisterKycRequest(string IdentityCardNumber);
