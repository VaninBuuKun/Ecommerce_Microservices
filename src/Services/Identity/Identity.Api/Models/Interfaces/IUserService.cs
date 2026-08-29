using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Identity.Models.Dtos;

namespace Ecommerce.Services.Identity.Api.Models.Interfaces;

public interface IUserService
{
    Task<Result<object>> GetCurrentUserAsync(long userId);
    Task<Result<RegisterResponse>> RegisterUserAsync(RegisterRequest request);
    Task<Result> ChangePasswordAsync(long userId, ChangePasswordRequest request);
    Task<Result> UpdateProfileAsync(long userId, UpdateProfileRequest request);
    Task<Result<object>> CreateUserByAdminAsync(CreateUserByAdminRequest request);
    Task<Result<UserListResponse>> GetUsersPagedAsync(int page, int pageSize, string? search);
    Task<Result<UserDetailResponse>> GetUserByIdAsync(long id);
    Task<Result<object>> GetPublicUserAsync(long id);
    Task<Result> UpdateUserAsync(long id, UpdateProfileRequest request, long currentUserId, bool isAdmin);
    Task<Result> AssignRoleAsync(long id, string roleName);
    Task<Result> LockUserAsync(long id);
    Task<Result> UnlockUserAsync(long id);
}
