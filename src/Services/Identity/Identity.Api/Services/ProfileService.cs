using System.Security.Claims;
using Duende.IdentityServer.Extensions;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Microsoft.AspNetCore.Identity;

namespace Ecommerce.Services.Identity.Api.Services;

public class ProfileService(UserManager<AppUser> userManager) : IProfileService
{
    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var userId = context.Subject.GetSubjectId();
        var user = await userManager.FindByIdAsync(userId);
        

        if (user != null)
        {
            var userRoles = await userManager.GetRolesAsync(user);
            
            
            var claims = new List<System.Security.Claims.Claim>
            {
                new System.Security.Claims.Claim("full_name", user.FirstName + user.LastName),
            };

            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }

            context.IssuedClaims.AddRange(claims);
        }
    }

    public async Task IsActiveAsync(IsActiveContext context)
    {
        var userId = context.Subject.GetSubjectId();
        var user = await userManager.FindByIdAsync(userId);

        if (user != null)
        {
            var isLocked = await userManager.IsLockedOutAsync(user);
            
            context.IsActive = !isLocked;
        }
        else
        {
            context.IsActive = false;
        }
    }
}