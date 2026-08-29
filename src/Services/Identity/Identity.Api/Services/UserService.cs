using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Identity.Api.Services;

public class UserService(
    UserManager<AppUser> userManager,
    RoleManager<IdentityRole<long>> roleManager,
    AppDbContext dbContext,
    ILogger<UserService> logger)
    : IUserService
{
    private static readonly ConcurrentDictionary<long, (string Gender, DateTime? BirthDate)> ProfileCache = new();

    private static string? NormalizeGender(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var lower = input.Trim().ToLower();
        return lower switch
        {
            "male" or "nam" => "Male",
            "female" or "nữ" or "nu" => "Female",
            "other" or "khác" or "khac" => "Other",
            _ => null
        };
    }

    public async Task<Result<object>> GetCurrentUserAsync(long userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Result<object>.Failure("Không tìm thấy thông tin tài khoản.", EErrorCode.NotFound);
        }

        var gender = user.Gender ?? "Female";
        DateTime? birthDate = user.BirthDate;

        if (ProfileCache.TryGetValue(user.Id, out var cachedProfile))
        {
            gender = cachedProfile.Gender;
            birthDate = cachedProfile.BirthDate;
        }

        var roles = await userManager.GetRolesAsync(user);

        return Result<object>.Success(new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.FirstName,
            user.LastName,
            user.AvatarUrl,
            Gender = gender,
            BirthDate = birthDate,
            Roles = roles
        });
    }

    public async Task<Result<RegisterResponse>> RegisterUserAsync(RegisterRequest request)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Result<RegisterResponse>.Failure("Email này đã được đăng ký!", EErrorCode.ValidationErrors);
        }

        var newUser = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(newUser, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result<RegisterResponse>.Failure($"Đăng ký thất bại: {errors}", EErrorCode.ValidationErrors);
        }

        await userManager.AddToRoleAsync(newUser, "Customer");

        return Result<RegisterResponse>.Success(new RegisterResponse
        {
            Success = true,
            Message = "Đăng ký tài khoản thành công!",
            UserId = newUser.Id
        });
    }

    public async Task<Result> ChangePasswordAsync(long userId, ChangePasswordRequest request)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy thông tin tài khoản.", EErrorCode.NotFound);
        }

        var result = await userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result> UpdateProfileAsync(long userId, UpdateProfileRequest request)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy thông tin tài khoản.", EErrorCode.NotFound);
        }

        if (!string.IsNullOrEmpty(request.Gender))
        {
            var normalizedGender = NormalizeGender(request.Gender);
            if (normalizedGender == null)
            {
                return Result.Failure("Giới tính không hợp lệ. Vui lòng chọn Male, Female hoặc Other.", EErrorCode.ValidationErrors);
            }
            user.Gender = normalizedGender;
        }

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;
        if (request.BirthDate.HasValue)
        {
            user.BirthDate = request.BirthDate.Value;
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        var genderToCache = user.Gender ?? "Female";
        var birthDateToCache = user.BirthDate;
        ProfileCache[user.Id] = (genderToCache, birthDateToCache);

        return Result.Success();
    }

    public async Task<Result<object>> CreateUserByAdminAsync(CreateUserByAdminRequest request)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Result<object>.Failure("Email này đã được sử dụng!", EErrorCode.ValidationErrors);
        }

        var newUser = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            AvatarUrl = request.AvatarUrl,
            EmailConfirmed = true,
            CreatedDate = DateTimeOffset.UtcNow
        };

        var result = await userManager.CreateAsync(newUser, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result<object>.Failure(errors, EErrorCode.ValidationErrors);
        }

        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role;
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole<long>(roleName));
        }

        await userManager.AddToRoleAsync(newUser, roleName);

        return Result<object>.Success(new
        {
            newUser.Id,
            newUser.Email,
            newUser.FirstName,
            newUser.LastName,
            newUser.AvatarUrl,
            Roles = new[] { roleName }
        });
    }

    public async Task<Result<UserListResponse>> GetUsersPagedAsync(int page, int pageSize, string? search)
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
                IsLockedOut = isLockedOut,
                IsActive = u.IsActive
            });
        }

        return Result<UserListResponse>.Success(new UserListResponse
        {
            Items = userDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<Result<UserDetailResponse>> GetUserByIdAsync(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result<UserDetailResponse>.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        var roles = await userManager.GetRolesAsync(user);
        var isLockedOut = await userManager.IsLockedOutAsync(user);

        return Result<UserDetailResponse>.Success(new UserDetailResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Phone = user.PhoneNumber,
            Roles = roles,
            IsLockedOut = isLockedOut,
            LockoutEnd = user.LockoutEnd
        });
    }

    public async Task<Result<object>> GetPublicUserAsync(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result<object>.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        return Result<object>.Success(new
        {
            user.Id,
            user.FullName,
            user.FirstName,
            user.LastName,
            user.AvatarUrl
        });
    }

    public async Task<Result> UpdateUserAsync(long id, UpdateProfileRequest request, long currentUserId, bool isAdmin)
    {
        if (currentUserId != id && !isAdmin)
        {
            return Result.Failure("Bạn không có quyền cập nhật tài khoản này!", EErrorCode.Forbidden);
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result> AssignRoleAsync(long id, string roleName)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        var roleExists = await roleManager.RoleExistsAsync(roleName);
        if (!roleExists)
        {
            return Result.Failure("Role không hợp lệ!", EErrorCode.ValidationErrors);
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, roleName);

        return Result.Success();
    }

    public async Task<Result> LockUserAsync(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        user.IsActive = false;
        var result = await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }

    public async Task<Result> UnlockUserAsync(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return Result.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        user.IsActive = true;
        var result = await userManager.SetLockoutEndDateAsync(user, null);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        return Result.Success();
    }
}
