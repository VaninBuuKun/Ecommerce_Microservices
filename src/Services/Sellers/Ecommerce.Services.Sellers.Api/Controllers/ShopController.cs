using System;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ActivateShop;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.BanShop;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.CreateShop;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.SuspendShop;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShopController(ISender sender, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await sender.Send(new Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetMySellerProfile.GetMySellerProfileQuery(currentUserService.UserId));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateShop([FromBody] CreateShopRequest request)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var command = new CreateShopCommand(
            OwnerUserId: currentUserService.UserId,
            Name: request.Name,
            Description: request.Description,
            LogoUrl: request.LogoUrl
        );

        var result = await sender.Send(command);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPut("{id:long}/suspend")]
    [Authorize]
    public async Task<IActionResult> SuspendShop(long id)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var isAdmin = User.IsInRole("Admin");
        var result = await sender.Send(new SuspendShopCommand(id, currentUserService.UserId, isAdmin));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cửa hàng đã được tạm ẩn.");
    }

    [HttpPut("{id:long}/activate")]
    [Authorize]
    public async Task<IActionResult> ActivateShop(long id)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var isAdmin = User.IsInRole("Admin");
        var result = await sender.Send(new ActivateShopCommand(id, currentUserService.UserId, isAdmin));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cửa hàng đã được kích hoạt lại.");
    }

    [HttpPut("{id:long}/ban")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BanShop(long id)
    {
        var result = await sender.Send(new BanShopCommand(id));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cửa hàng đã bị khóa bởi Admin.");
    }
}

public record CreateShopRequest(
    string Name,
    string Description,
    string LogoUrl
);
