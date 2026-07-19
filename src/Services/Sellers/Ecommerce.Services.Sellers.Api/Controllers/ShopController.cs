using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ApproveShop;
using Ecommerce.Services.Sellers.Api.Features.Shops.Commands.RegisterShop;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using BuildingBlocks.Auth;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShopController(ISender sender, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost("register")]
    [Authorize]
    public async Task<IActionResult> RegisterShop([FromBody] RegisterShopRequest request)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var command = new RegisterShopCommand(
            OwnerUserId: currentUserService.UserId,
            Name: request.Name,
            Description: request.Description,
            RecipientName: request.RecipientName,
            Phone: request.Phone,
            Province: request.Province,
            District: request.District,
            Ward: request.Ward,
            AddressLine: request.AddressLine,
            ProvinceId: request.ProvinceId,
            DistrictId: request.DistrictId,
            WardCode: request.WardCode,
            IdentityCardNumber: string.Empty // CCCD đã quản lý riêng ở Kyc
        );

        var result = await sender.Send(command);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    // Admin duyệt kích hoạt hoạt động của Shop
    [HttpPut("{id:long}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveShop(long id)
    {
        var result = await sender.Send(new ApproveShopCommand(id));
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cửa hàng đã được kích hoạt hoạt động chính thức.");
    }
}

public record RegisterShopRequest(
    string Name,
    string Description,
    string RecipientName,
    string Phone,
    string Province,
    string District,
    string Ward,
    string AddressLine,
    int ProvinceId,
    int DistrictId,
    string WardCode
);
