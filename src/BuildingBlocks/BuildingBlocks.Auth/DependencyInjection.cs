using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace BuildingBlocks.Auth;

public static class DependencyInjection
{
    public static IServiceCollection AddBuildingBlocsAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var identityUrl = configuration.GetSection("IdentityUrl").Value;
        
        services.AddHttpContextAccessor(); 
        
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.Authority = identityUrl; //Kích hoạt oidc, server sẽ ngầm định lấy public key để verify ở Authority + "/.well-known/openid-configuration".
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters = new TokenValidationParameters()
            {
                ValidateAudience = false,
                ValidateIssuer = false, 
            };
        });

        services.AddAuthorization();
        
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        return services;
    }
}