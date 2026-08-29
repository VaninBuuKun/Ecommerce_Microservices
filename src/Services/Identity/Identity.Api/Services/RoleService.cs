using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Identity.Api.Services;

public class RoleService(
    RoleManager<IdentityRole<long>> roleManager,
    AppDbContext dbContext,
    ILogger<RoleService> logger)
    : IRoleService
{
    public async Task<Result<IEnumerable<RoleDto>>> GetRolesAsync()
    {
        try
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

            return Result<IEnumerable<RoleDto>>.Success(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy danh sách vai trò.");
            return Result<IEnumerable<RoleDto>>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result> CreateRoleAsync(CreateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RoleName))
        {
            return Result.Failure("Tên vai trò không được để trống!", EErrorCode.ValidationErrors);
        }

        var exists = await roleManager.RoleExistsAsync(request.RoleName.Trim());
        if (exists)
        {
            return Result.Failure("Vai trò này đã tồn tại!", EErrorCode.ValidationErrors);
        }

        var result = await roleManager.CreateAsync(new IdentityRole<long>(request.RoleName.Trim()));
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result> UpdateRoleAsync(long id, UpdateRoleRequest request)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role == null)
        {
            return Result.Failure("Không tìm thấy vai trò!", EErrorCode.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.NewRoleName))
        {
            return Result.Failure("Tên vai trò không được để trống!", EErrorCode.ValidationErrors);
        }

        var newName = request.NewRoleName.Trim();
        var exists = await roleManager.RoleExistsAsync(newName);
        if (exists && role.Name != newName)
        {
            return Result.Failure("Vai trò với tên mới này đã tồn tại!", EErrorCode.ValidationErrors);
        }

        role.Name = newName;
        var result = await roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result> DeleteRoleAsync(long id)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role == null)
        {
            return Result.Failure("Không tìm thấy vai trò!", EErrorCode.NotFound);
        }

        if (role.Name is "Admin" or "User")
        {
            return Result.Failure("Không thể xóa các vai trò mặc định của hệ thống (Admin, User)!", EErrorCode.ValidationErrors);
        }

        var result = await roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }
}
