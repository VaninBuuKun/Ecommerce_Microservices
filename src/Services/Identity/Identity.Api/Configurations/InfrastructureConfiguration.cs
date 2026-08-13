using Ecommerce.Services.Identity.Api.Config;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        //Db
        var connectionString = configuration.GetConnectionString("Database") ?? throw new InvalidOperationException("Database connection string is missing.");
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));
        
        services.AddIdentity<AppUser, IdentityRole<long>>(options =>
            {
                // Cấu hình độ bảo mật mật khẩu (bỏ bớt yêu cầu để dễ test)
                options.Password.RequireDigit = false;
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
        
                // Khóa tài khoản 5 phút nếu đăng nhập sai 5 lần
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
            })
            .AddEntityFrameworkStores<AppDbContext>() // Lưu dữ liệu vào PostgreSQL
            .AddDefaultTokenProviders();
        
        // ══════════════════════════════════════════════════
        // Nó lo toàn bộ: cấp token, verify token, refresh token, revoke token...
        // ══════════════════════════════════════════════════
        services.AddIdentityServer(options =>
            {
                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseSuccessEvents = true;
            })
            .AddInMemoryIdentityResources(IdentityServerConfig.IdentityResources) // Load cấu hình resources
            .AddInMemoryApiScopes(IdentityServerConfig.ApiScopes) // Load cấu hình scopes
            .AddInMemoryClients(IdentityServerConfig.Clients) // Load cấu hình clients
            .AddAspNetIdentity<AppUser>() // Kết nối Duende với ASP.NET Identity để nó dùng UserManager kiểm tra mật khẩu
            .AddOperationalStore(options =>
            {
                options.ConfigureDbContext = b => b.UseNpgsql(
                    connectionString,
                    dbOptions => dbOptions.MigrationsAssembly(typeof(Program).Assembly.GetName().Name));
            })
            .AddDeveloperSigningCredential() // Tự sinh cặp khóa RSA (chỉ dùng trong môi trường dev)
            .AddProfileService<ProfileService>();
        
        services.AddLocalApiAuthentication();
        
        services.AddBuildingBlocksConfigurations(configuration);
        services.AddGrpcConfigurations(configuration);
        services.AddServiceConfigurations(configuration);
        
        
        services.AddHttpContextAccessor();
        services.AddHttpClient();
    }
}