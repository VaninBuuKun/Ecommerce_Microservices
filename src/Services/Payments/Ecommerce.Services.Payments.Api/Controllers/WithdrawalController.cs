using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/withdrawals")]
[Authorize]
public class WithdrawalController(IWithdrawalService withdrawalService, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateWithdrawal([FromBody] CreateWithdrawalRequest request)
    {
        var userId = currentUserService.UserId;
        var result = await withdrawalService.CreateWithdrawal(userId, request);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    public async Task<IActionResult> GetMyWithdrawals()
    {
        var userId = currentUserService.UserId;
        var result = await withdrawalService.GetMyWithdrawals(userId);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
