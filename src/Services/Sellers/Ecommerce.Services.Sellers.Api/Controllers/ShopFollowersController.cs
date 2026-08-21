using BuildingBlocks.Auth;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ToggleFollowShop;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.CheckFollowShopStatus;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetFollowedShops;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/shops")]
[Authorize]
public class ShopFollowersController(ISender sender, ICurrentUserService userService) : ControllerBase
{
    [HttpPost("{shopId}/follow")]
    public async Task<IActionResult> ToggleFollowShop(long shopId)
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await sender.Send(new ToggleFollowShopCommand(customerId, shopId));
        if (result.IsSuccess)
        {
            return Ok(new { isFollowing = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("followed")]
    public async Task<IActionResult> GetFollowedShops()
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await sender.Send(new GetFollowedShopsQuery(customerId));
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{shopId}/follow-status")]
    public async Task<IActionResult> CheckFollowStatus(long shopId)
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await sender.Send(new CheckFollowShopStatusQuery(customerId, shopId));
        if (result.IsSuccess)
        {
            return Ok(new { isFollowing = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
