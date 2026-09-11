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
    [AllowAnonymous]
    public async Task<IActionResult> CheckFollowStatus(long shopId)
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Ok(new { isFollowing = false });
        }

        var result = await shopService.CheckFollowStatusAsync(customerId, shopId);
        if (result.IsSuccess)
        {
            return Ok(new { isFollowing = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{shopId}/followers")]
    public async Task<IActionResult> GetShopFollowers(
        long shopId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DateTime? fromDate = null)
    {
        var result = await shopService.GetShopFollowersAsync(shopId, pageNumber, pageSize, fromDate);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{shopId}/followers-count")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFollowersCount(long shopId)
    {
        var result = await shopService.GetShopFollowersCountAsync(shopId);
        if (result.IsSuccess)
        {
            return Ok(new { count = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
