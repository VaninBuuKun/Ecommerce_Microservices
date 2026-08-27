using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController(IWalletService walletService, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost("activate")]
    public async Task<IActionResult> ActivateWallet([FromBody] ActivateWalletRequest request)
    {
        var userId = currentUserService.UserId;
        var result = await walletService.ActivateWallet(userId, request);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var userId = currentUserService.UserId;
        var result = await walletService.GetWalletByUserId(userId);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("bank-accounts")]
    public async Task<IActionResult> AddBankAccount([FromBody] AddBankAccountRequest request)
    {
        var userId = currentUserService.UserId;
        var result = await walletService.AddBankAccount(userId, request);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("bank-accounts/{id:long}")]
    public async Task<IActionResult> UpdateBankAccount([FromRoute] long id, [FromBody] AddBankAccountRequest request)
    {
        var userId = currentUserService.UserId;
        var result = await walletService.UpdateBankAccount(userId, id, request);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("bank-accounts")]
    public async Task<IActionResult> GetBankAccounts()
    {
        var userId = currentUserService.UserId;
        var result = await walletService.GetBankAccounts(userId);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions()
    {
        var userId = currentUserService.UserId;
        var result = await walletService.GetWalletTransactions(userId);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
