using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Duende.IdentityServer;
using Ecommerce.Services.Identity.Api.Persistances;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
public class RolesController(
    RoleManager<IdentityRole<long>> roleManager,
    AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
    {
        var roles = await roleManager.Roles.ToListAsync();
        
        var userRoleCounts = await dbContext.UserRoles
            .GroupBy(ur => ur.RoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count);

        var result = roles.Select(r => new RoleDto
        {
            Id = r.Id,
            Name = r.Name ?? string.Empty,
            UserCount = userRoleCounts.TryGetValue(r.Id, out var count) ? count : 0
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RoleName))
        {
            return BadRequest("Tên vai trò không được để trống!");
        }

        var exists = await roleManager.RoleExistsAsync(request.RoleName.Trim());
        if (exists)
        {
            return BadRequest("Vai trò này đã tồn tại!");
        }

        var result = await roleManager.CreateAsync(new IdentityRole<long>(request.RoleName.Trim()));
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok($"Đã tạo vai trò '{request.RoleName}' thành công!");
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateRole(long id, [FromBody] UpdateRoleRequest request)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role == null)
        {
            return NotFound("Không tìm thấy vai trò!");
        }

        if (string.IsNullOrWhiteSpace(request.NewRoleName))
        {
            return BadRequest("Tên vai trò không được để trống!");
        }

        var newName = request.NewRoleName.Trim();
        var exists = await roleManager.RoleExistsAsync(newName);
        if (exists && role.Name != newName)
        {
            return BadRequest("Vai trò với tên mới này đã tồn tại!");
        }

        role.Name = newName;
        var result = await roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Cập nhật tên vai trò thành công!");
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteRole(long id)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role == null)
        {
            return NotFound("Không tìm thấy vai trò!");
        }

        // Standard System protection
        if (role.Name is "Admin" or "User")
        {
            return BadRequest("Không thể xóa các vai trò mặc định của hệ thống (Admin, User)!");
        }

        var result = await roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Ok("Đã xóa vai trò thành công!");
    }
}
