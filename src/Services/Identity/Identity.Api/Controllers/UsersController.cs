using System.Security.Claims;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Extensions;
using Duende.IdentityServer;
using Ecommerce.Services.Identity.Api.Services;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Identity.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme)]
public class UsersController(
    ICurrentUserService currentUserService,
    IUserService userService,
    IAddressService addressService) : ControllerBase
{
    // ==========================================
    // SECTION 1: PERSONAL ACCOUNT APIs (me, profile)
    // ==========================================

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await userService.GetCurrentUserAsync(userId);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await userService.ChangePasswordAsync(userId, request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Đổi mật khẩu thành công!");
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await userService.UpdateProfileAsync(userId, request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cập nhật thông tin cá nhân thành công!");
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> CreateUserByAdmin([FromBody] CreateUserByAdminRequest request)
    {
        var result = await userService.CreateUserByAdminAsync(request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    // ==========================================
    // SECTION 2: ADMIN USER MANAGEMENT APIs
    // ==========================================

    [HttpGet]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await userService.GetUsersPagedAsync(page, pageSize, search);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("{id:long}")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetUserById(long id)
    {
        var result = await userService.GetUserByIdAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpGet("{id:long}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicUser(long id)
    {
        var result = await userService.GetPublicUserAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateUser(long id, [FromBody] UpdateProfileRequest request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        long currentUserId = 0;
        if (!string.IsNullOrEmpty(userIdStr)) long.TryParse(userIdStr, out currentUserId);
        var isAdmin = User.IsInRole("Admin");

        var result = await userService.UpdateUserAsync(id, request, currentUserId, isAdmin);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cập nhật thông tin thành công!");
    }

    [HttpPut("{id:long}/roles")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> AssignRole(long id, [FromBody] AssignRoleRequest request)
    {
        var result = await userService.AssignRoleAsync(id, request.RoleName);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok($"Đã gán role '{request.RoleName}' cho người dùng!");
    }

    [HttpPost("{id:long}/lock")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> LockUser(long id)
    {
        var result = await userService.LockUserAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Đã cấm/khóa tài khoản người dùng thành công!");
    }

    [HttpPost("{id:long}/unlock")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UnlockUser(long id)
    {
        var result = await userService.UnlockUserAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Đã mở khóa tài khoản người dùng thành công!");
    }

    // ==========================================
    // SECTION 3: USER ADDRESSES APIs (Sub-resource)
    // ==========================================

    [HttpGet("addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        long userId = currentUserService.UserId;
        if (userId == 0) return Unauthorized();

        var addresses = await addressService.GetAddressesByUserIdAsync(userId);
        return Ok(addresses);
    }

    [HttpPost("addresses")]
    public async Task<IActionResult> CreateAddress([FromBody] CreateUserAddressRequest request)
    {
        long userId = currentUserService.UserId;
        if (userId == 0) return Unauthorized();

        var dto = new CreateAddressDto
        {
            RecipientName = request.RecipientName,
            Phone = request.Phone,
            ProvinceId = request.ProvinceId,
            DistrictId = request.DistrictId,
            WardId = request.WardId,
            AddressLine = request.AddressLine,
            IsDefault = request.IsDefault
        };

        var newAddress = await addressService.CreateAddressAsync(userId, dto);
        return Ok(newAddress);
    }

    [HttpDelete("addresses/{id:long}")]
    public async Task<IActionResult> DeleteAddress(long id)
    {
        long userId = currentUserService.UserId;
        if (userId == 0) return Unauthorized();

        var success = await addressService.DeleteAddressAsync(userId, id);
        if (!success)
        {
            return NotFound("Địa chỉ không tồn tại hoặc không thuộc về người dùng này.");
        }

        return NoContent();
    }

    [HttpPut("addresses/{id:long}/default")]
    public async Task<IActionResult> SetDefaultAddress(long id)
    {
        long userId = currentUserService.UserId;
        if (userId == 0) return Unauthorized();

        var success = await addressService.SetDefaultAddressAsync(userId, id);
        if (!success)
        {
            return NotFound("Địa chỉ không tồn tại hoặc không thuộc về người dùng này.");
        }

        return Ok("Đặt địa chỉ mặc định thành công!");
    }
}

public class CreateUserAddressRequest
{
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public long ProvinceId { get; set; }
    public long DistrictId { get; set; }
    public long WardId { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
