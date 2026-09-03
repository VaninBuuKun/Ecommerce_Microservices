using System.Threading.Tasks;
using BuildingBlocks.Shared.Extensions;
using Duende.IdentityServer;
using Ecommerce.Services.Identity.Api.Services;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Identity.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme, Roles = "Admin")]
public class RolesController(IRoleService roleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var result = await roleService.GetRolesAsync();
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        var result = await roleService.CreateRoleAsync(request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok($"Đã tạo vai trò '{request.RoleName}' thành công!");
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateRole(long id, [FromBody] UpdateRoleRequest request)
    {
        var result = await roleService.UpdateRoleAsync(id, request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Cập nhật tên vai trò thành công!");
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteRole(long id)
    {
        var result = await roleService.DeleteRoleAsync(id);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Message);
        }

        return Ok("Đã xóa vai trò thành công!");
    }
}
