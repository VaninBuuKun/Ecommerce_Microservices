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
[Route("api/auth")]
[Authorize(AuthenticationSchemes = IdentityServerConstants.LocalApi.AuthenticationScheme)]
public class AuthController(IUserService userService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await userService.RegisterUserAsync(request);
        if (!result.IsSuccess)
        {
            return StatusCode((int)result.ErrorCode.ToHttpStatusCode(), result.Value ?? new RegisterResponse
            {
                Success = false,
                Message = result.Message
            });
        }

        return Ok(result.Value);
    }
}
