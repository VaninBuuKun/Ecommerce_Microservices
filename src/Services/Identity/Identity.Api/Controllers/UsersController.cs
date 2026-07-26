using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Duende.IdentityServer;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Services;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme)]
public class UsersController(
    ICurrentUserService currentUserService,
    IAddressService addressService,
    UserManager<AppUser> userManager,
    RoleManager<IdentityRole<long>> roleManager,
    AppDbContext dbContext) : ControllerBase
{
    // ==========================================
    // SECTION 1: PERSONAL ACCOUNT APIs (me, profile)
    // ==========================================
    
    // Thay thế auth/me cũ
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.FirstName,
            user.LastName,
            user.AvatarUrl,
            Roles = await userManager.GetRolesAsync(user)
        });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var user = await userManager.FindByIdAsync(currentUserId!);
        if (user == null) return NotFound();

        var result = await userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Đổi mật khẩu thành công!");
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var user = await userManager.FindByIdAsync(currentUserId!);
        if (user == null) return NotFound();

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Cập nhật thông tin cá nhân thành công!");
    }

    // ==========================================
    // SECTION 2: ADMIN USER MANAGEMENT APIs
    // ==========================================
    
    [HttpGet]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<ActionResult<UserListResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var query = userManager.Users;

        if (!string.IsNullOrEmpty(search))
        {
            var searchUpper = search.ToUpper();
            query = query.Where(u => (u.Email != null && u.Email.ToUpper().Contains(searchUpper)) ||
                                     (u.FirstName != null && u.FirstName.ToUpper().Contains(searchUpper)) ||
                                     (u.LastName != null && u.LastName.ToUpper().Contains(searchUpper)));
        }

        var totalCount = await query.CountAsync();
        
        var users = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        var userIds = users.Select(u => u.Id).ToList();
        var userRoles = await dbContext.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(dbContext.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .ToListAsync();

        var userRolesLookup = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Name ?? "").ToList());

        var userDtos = new List<UserDto>();
        var now = DateTimeOffset.UtcNow;
        foreach (var u in users)
        {
            var roles = userRolesLookup.TryGetValue(u.Id, out var r) ? r : new List<string>();
            var isLockedOut = u.LockoutEnabled && u.LockoutEnd.HasValue && u.LockoutEnd.Value > now;

            userDtos.Add(new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                AvatarUrl = u.AvatarUrl,
                Roles = roles,
                IsLockedOut = isLockedOut
            });
        }

        return Ok(new UserListResponse
        {
            Items = userDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:long}")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<ActionResult<UserDetailResponse>> GetUserById(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("Không tìm thấy người dùng!");

        return Ok(new UserDetailResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Roles = await userManager.GetRolesAsync(user),
            IsLockedOut = await userManager.IsLockedOutAsync(user),
            LockoutEnd = user.LockoutEnd
        });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateUser(long id, [FromBody] UpdateProfileRequest request)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var isAdmin = User.IsInRole("Admin");

        if (currentUserId != id.ToString() && !isAdmin)
        {
            return Forbid("Bạn không có quyền cập nhật tài khoản này!");
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("Không tìm thấy người dùng!");

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Cập nhật thông tin thành công!");
    }

    [HttpPut("{id:long}/roles")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> AssignRole(long id, [FromBody] AssignRoleRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("Không tìm thấy người dùng!");

        var roleExists = await roleManager.RoleExistsAsync(request.RoleName);
        if (!roleExists) return BadRequest("Role không hợp lệ!");

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, request.RoleName);

        return Ok($"Đã gán role '{request.RoleName}' cho người dùng!");
    }

    [HttpPost("{id:long}/lock")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> LockUser(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("Không tìm thấy người dùng!");

        var result = await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Đã khóa tài khoản thành công!");
    }

    [HttpPost("{id:long}/unlock")]
    [Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UnlockUser(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("Không tìm thấy người dùng!");

        var result = await userManager.SetLockoutEndDateAsync(user, null);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Đã mở khóa tài khoản thành công!");
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
        
        var result = addresses.Select(a => new
        {
            a.Id,
            a.RecipientName,
            a.Phone,
            a.ProvinceId,
            a.DistrictId,
            a.WardCode,
            a.AddressLine,
            a.IsDefault
        });

        return Ok(result);
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
            WardCode = request.WardCode,
            AddressLine = request.AddressLine,
            IsDefault = request.IsDefault
        };

        var newAddress = await addressService.CreateAddressAsync(userId, dto);

        return Ok(new
        {
            newAddress.Id,
            newAddress.RecipientName,
            newAddress.Phone,
            newAddress.ProvinceId,
            newAddress.DistrictId,
            newAddress.WardCode,
            newAddress.AddressLine,
            newAddress.IsDefault
        });
    }

    [HttpDelete("addresses/{id:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid id)
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
}

public class CreateUserAddressRequest
{
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public int DistrictId { get; set; }
    public string WardCode { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
