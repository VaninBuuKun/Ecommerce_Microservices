using Ecommerce.Services.Identity.Api.Models.Entities;
using Identity.Models.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Duende.IdentityServer;

namespace Ecommerce.Services.Identity.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme)]
public class AuthController(
    UserManager<AppUser> userManager,
    RoleManager<IdentityRole<long>> roleManager) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = "Email này đã được đăng ký!"
            });
        }

        var newUser = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = true // Bỏ qua bước xác thực email cho đơn giản
        };

        // CreateAsync tự động băm mật khẩu bằng bcrypt trước khi lưu vào DB
        var result = await userManager.CreateAsync(newUser, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = $"Đăng ký thất bại: {errors}"
            });
        }

        // Gán role mặc định là "Customer" cho user mới đăng ký
        await userManager.AddToRoleAsync(newUser, "Customer");

        return Ok(new RegisterResponse
        {
            Success = true,
            Message = "Đăng ký tài khoản thành công!",
            UserId = newUser.Id
        });
    }
}
