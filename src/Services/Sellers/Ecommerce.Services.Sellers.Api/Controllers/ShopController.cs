using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Sellers.Api.Services;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Sellers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShopController(IShopService shopService, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("all")]
    public async Task<IActionResult> GetAllShops(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null)
    {
        var result = await shopService.GetAllShopsAsync(pageNumber, pageSize, searchTerm, status);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await shopService.GetMySellerProfileAsync(currentUserService.UserId);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("{id:long}")]
    [Authorize]
    public async Task<IActionResult> GetShopById(long id)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await shopService.GetShopByIdAsync(id, currentUserService.UserId);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("{id:long}/public")]
    public async Task<IActionResult> GetPublicShopById(long id)
    {
        var result = await shopService.GetPublicShopByIdAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("owner/{ownerUserId:long}")]
    public async Task<IActionResult> GetPublicShopsByOwnerId(long ownerUserId)
    {
        var result = await shopService.GetPublicShopsByOwnerIdAsync(ownerUserId);
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

        var result = await shopService.CreateShopAsync(currentUserService.UserId, request.Name, request.Description, request.LogoUrl);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPut("{id:long}")]
    [Authorize]
    public async Task<IActionResult> UpdateShop(long id, [FromBody] UpdateShopRequest request)
    {
        if (!currentUserService.IsAuthenticated)
        {
            return Unauthorized("Tài khoản chưa được xác thực danh tính.");
        }

        var result = await shopService.UpdateShopAsync(
            id,
            currentUserService.UserId,
            request.Name,
            request.Description,
            request.LogoUrl,
            request.RecipientName,
            request.Phone,
            request.AddressLine,
            request.ProvinceId,
            request.DistrictId,
            request.WardId
        );

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
        var result = await shopService.SuspendShopAsync(id, currentUserService.UserId, isAdmin);
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
        var result = await shopService.ActivateShopAsync(id, currentUserService.UserId, isAdmin);
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
        var result = await shopService.BanShopAsync(id);
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

public record UpdateShopRequest(
    string Name,
    string Description,
    string? LogoUrl,
    string RecipientName,
    string Phone,
    string AddressLine,
    long ProvinceId,
    long DistrictId,
    long WardId
);
