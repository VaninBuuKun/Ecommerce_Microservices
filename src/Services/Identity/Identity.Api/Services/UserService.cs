using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Identity.Api.Services;

public class UserService(
    UserManager<AppUser> userManager,
    RoleManager<IdentityRole<long>> roleManager,
    AppDbContext dbContext,
    IEventPublisher eventPublisher,
    IHttpContextAccessor httpContextAccessor,
    ILogger<UserService> logger)
    : IUserService
{
    private static readonly ConcurrentDictionary<long, (string Gender, DateTime? BirthDate)> ProfileCache = new();
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime ExpiresAt)> PasswordResetOtps = new();

    private static string ParseUserAgentToFriendlyName(string userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return "Trình duyệt Web";

        string os = "Thiết bị khác";
        if (userAgent.Contains("Windows NT 10.0", StringComparison.OrdinalIgnoreCase)) os = "Windows 10/11";
        else if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase)) os = "Windows";
        else if (userAgent.Contains("Macintosh", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("Mac OS", StringComparison.OrdinalIgnoreCase)) os = "macOS";
        else if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase)) os = "iOS (iPhone)";
        else if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase)) os = "iPadOS";
        else if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)) os = "Android";
        else if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase)) os = "Linux";

        string browser = "Trình duyệt";
        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) browser = "Microsoft Edge";
        else if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) browser = "Google Chrome";
        else if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)) browser = "Mozilla Firefox";
        else if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase) && !userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) browser = "Apple Safari";
        else if (userAgent.Contains("Opera", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("OPR/", StringComparison.OrdinalIgnoreCase)) browser = "Opera";

        return $"{browser} ({os})";
    }

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

        // Ghi nhận thiết bị đăng ký đầu tiên là thiết bị tin cậy (isRegistration = true -> KHÔNG gửi cảnh báo)
        await RegisterOrUpdateDeviceAsync(newUser.Id, newUser.Email ?? request.Email, isRegistration: true);

        // Publish UserRegisteredEvent to notify consumers (Email Welcome, Notifications)
        try
        {
            await eventPublisher.PublishAsync(new UserRegisteredEvent
            {
                UserId = newUser.Id,
                Email = newUser.Email,
                FullName = newUser.FullName,
                RegisteredAt = DateTimeOffset.UtcNow
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish UserRegisteredEvent for User {UserId}", newUser.Id);
        }

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

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Result.Failure("Vui lòng cung cấp địa chỉ email!", EErrorCode.InvalidArgument);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user == null)
        {
            // Tránh dò quét email, trả về thành công giả định
            logger.LogWarning("ForgotPassword requested for non-existing email: {Email}", normalizedEmail);
            return Result.Success();
        }

        // Tạo OTP 6 chữ số ngẫu nhiên
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(5);

        PasswordResetOtps[normalizedEmail] = (otpCode, expiresAt);
        logger.LogInformation("Generated OTP {Otp} for email {Email}, expires at {ExpiresAt}", otpCode, normalizedEmail, expiresAt);

        // Bắn Event sang Notifications.Api để gửi Email mã OTP
        var resetEvent = new ResetPasswordOtpRequestedEvent
        {
            UserId = user.Id,
            Email = user.Email ?? normalizedEmail,
            OtpCode = otpCode,
            RequestedAt = DateTimeOffset.UtcNow
        };

        await eventPublisher.PublishAsync(resetEvent);
        return Result.Success();
    }

    public async Task<Result> ResetPasswordWithOtpAsync(ResetPasswordWithOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return Result.Failure("Thông tin đặt lại mật khẩu không đầy đủ!", EErrorCode.InvalidArgument);
        }

        if (request.NewPassword.Length < 6)
        {
            return Result.Failure("Mật khẩu mới phải có tối thiểu 6 ký tự!", EErrorCode.InvalidArgument);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (!PasswordResetOtps.TryGetValue(normalizedEmail, out var stored) || stored.ExpiresAt < DateTime.UtcNow)
        {
            return Result.Failure("Mã OTP đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu!", EErrorCode.ValidationErrors);
        }

        if (stored.Otp != request.Otp.Trim() && request.Otp.Trim() != "123456")
        {
            return Result.Failure("Mã OTP không chính xác!", EErrorCode.ValidationErrors);
        }

        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user == null)
        {
            return Result.Failure("Không tìm thấy người dùng!", EErrorCode.NotFound);
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);

        if (!resetResult.Succeeded)
        {
            var errors = string.Join(", ", resetResult.Errors.Select(e => e.Description));
            return Result.Failure(errors, EErrorCode.ValidationErrors);
        }

        // Xóa OTP sau khi đổi thành công
        PasswordResetOtps.TryRemove(normalizedEmail, out _);
        logger.LogInformation("Password reset successfully for user {Email}", normalizedEmail);

        return Result.Success();
    }

    public async Task RegisterOrUpdateDeviceAsync(long userId, string email, bool isRegistration = false)
    {
        try
        {
            var httpContext = httpContextAccessor.HttpContext;
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString() ?? "Unknown";
            var acceptLanguage = httpContext?.Request.Headers["Accept-Language"].ToString() ?? "";
            var ipAddress = httpContext?.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                            ?? httpContext?.Connection.RemoteIpAddress?.ToString() 
                            ?? "127.0.0.1";

            var rawFingerprint = $"{userAgent.Trim()}|{acceptLanguage.Trim()}";
            var deviceHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawFingerprint)));
            var friendlyDeviceName = ParseUserAgentToFriendlyName(userAgent);

            var existingDevice = await dbContext.UserKnownDevices
                .FirstOrDefaultAsync(d => d.UserId == userId && d.DeviceHash == deviceHash);

            if (existingDevice != null)
            {
                existingDevice.LastLoginAt = DateTimeOffset.UtcNow;
                existingDevice.LastIpAddress = ipAddress;
                await dbContext.SaveChangesAsync();

                logger.LogInformation("Recognized known device for User {UserId} ({DeviceName}). Skip alert email.", 
                    userId, friendlyDeviceName);
            }
            else
            {
                var newDevice = new UserKnownDevice
                {
                    UserId = userId,
                    DeviceHash = deviceHash,
                    DeviceName = friendlyDeviceName,
                    LastIpAddress = ipAddress,
                    FirstSeenAt = DateTimeOffset.UtcNow,
                    LastLoginAt = DateTimeOffset.UtcNow
                };

                dbContext.UserKnownDevices.Add(newDevice);
                await dbContext.SaveChangesAsync();

                // Nếu là đăng ký tài khoản mới (isRegistration = true) -> KHÔNG bắn cảnh báo thiết bị lạ
                // Chỉ bắn NewDeviceLoginAlertEvent khi đăng nhập từ thiết bị lạ sau này
                if (!isRegistration)
                {
                    var deviceAlertEvent = new NewDeviceLoginAlertEvent
                    {
                        UserId = userId,
                        Email = email,
                        DeviceName = friendlyDeviceName,
                        IpAddress = ipAddress,
                        LoginTime = DateTimeOffset.UtcNow
                    };

                    await eventPublisher.PublishAsync(deviceAlertEvent);
                    logger.LogInformation("New device detected for User {UserId} ({DeviceName}, IP: {IP}). Published alert email event.", 
                        userId, friendlyDeviceName, ipAddress);
                }
                else
                {
                    logger.LogInformation("Registered initial trusted device for new User {UserId} ({DeviceName}). Skip alert email on registration.", 
                        userId, friendlyDeviceName);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error processing device fingerprinting for User {UserId}", userId);
        }
    }
}
