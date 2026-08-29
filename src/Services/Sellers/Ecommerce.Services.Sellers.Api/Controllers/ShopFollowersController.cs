using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Ecommerce.Services.Sellers.Api.Services;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/shop")]
[Authorize]
public class ShopFollowersController(IShopService shopService, ICurrentUserService userService) : ControllerBase
{
    [HttpPost("{shopId}/follow")]
    public async Task<IActionResult> ToggleFollowShop(long shopId)
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await shopService.ToggleFollowShopAsync(customerId, shopId);
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

        var result = await shopService.GetFollowedShopsAsync(customerId);
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

        var result = await shopService.CheckFollowStatusAsync(customerId, shopId);
        if (result.IsSuccess)
        {
            return Ok(new { isFollowing = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
