using System.Threading.Tasks;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Validation;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Ecommerce.Services.Identity.Api.Services;

public class CustomResourceOwnerPasswordValidator(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IUserService userService) : IResourceOwnerPasswordValidator
{
    public async Task ValidateAsync(ResourceOwnerPasswordValidationContext context)
    {
        var user = await userManager.FindByEmailAsync(context.UserName) 
                   ?? await userManager.FindByNameAsync(context.UserName);

        if (user == null)
        {
            context.Result = new GrantValidationResult(
                TokenRequestErrors.InvalidGrant, 
                "invalid_credentials");
            return;
        }

        // 1. Vô hiệu hóa bởi Admin (Block)
        if (!user.IsActive)
        {
            context.Result = new GrantValidationResult(
                TokenRequestErrors.InvalidGrant, 
                "account_disabled");
            return;
        }

        // 2. Tự động khóa tạm thời do sai mật khẩu trước đó
        if (await userManager.IsLockedOutAsync(user))
        {
            context.Result = new GrantValidationResult(
                TokenRequestErrors.InvalidGrant, 
                "account_locked");
            return;
        }

        // 3. Kiểm tra mật khẩu (lockoutOnFailure: true để đếm số lần nhập sai)
        var result = await signInManager.CheckPasswordSignInAsync(user, context.Password, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            await userManager.ResetAccessFailedCountAsync(user);

            // 4. Ủy nhiệm toàn bộ logic nhận diện thiết bị & cảnh báo đăng nhập cho IUserService
            await userService.RegisterOrUpdateDeviceAsync(user.Id, user.Email ?? context.UserName);
            
            context.Result = new GrantValidationResult(
                user.Id.ToString(), 
                "password");
            return;
        }

        if (result.IsLockedOut)
        {
            context.Result = new GrantValidationResult(
                TokenRequestErrors.InvalidGrant, 
                "account_locked");
            return;
        }

        // Mặc định: Sai mật khẩu
        context.Result = new GrantValidationResult(
            TokenRequestErrors.InvalidGrant, 
            "invalid_credentials");
    }
}
