using BuildingBlocks.Auth;
using Ecommerce.Services.Catalog.Application.Features.Wishlists.Commands.ToggleWishlist;
using Ecommerce.Services.Catalog.Application.Features.Wishlists.Queries.GetMyWishlist;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistsController(ISender sender, ICurrentUserService userService) : ControllerBase
{
    [HttpPost("toggle/{productId}")]
    public async Task<IActionResult> ToggleWishlist(Guid productId)
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await sender.Send(new ToggleWishlistCommand(customerId, productId));
        if (result.IsSuccess)
        {
            return Ok(new { isLiked = result.Value });
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        var customerId = userService.UserId;
        if (customerId <= 0)
        {
            return Unauthorized("Không tìm thấy thông tin người dùng.");
        }

        var result = await sender.Send(new GetMyWishlistQuery(customerId));
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
