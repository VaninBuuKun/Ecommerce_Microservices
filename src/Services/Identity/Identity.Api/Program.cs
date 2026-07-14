using BuildingBlocks.Logging;
using Ecommerce.Services.Identity.Api.Config;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Services;
using Identity.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("identityApi");
Log.Information("Identity Service starting......");
try
{
    builder.Services.AddOpenApi();

    // ══════════════════════════════════════════════════
    // BƯỚC 1: Kết nối PostgreSQL
    // ══════════════════════════════════════════════════
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("Database")));

    // ══════════════════════════════════════════════════
    // BƯỚC 2: Đăng ký ASP.NET Identity
    // Nó quản lý: User, mật khẩu, role, đăng nhập sai bao nhiêu lần thì khóa...
    // ══════════════════════════════════════════════════
    builder.Services.AddIdentity<AppUser, IdentityRole<long>>(options =>
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
    // BƯỚC 3: Đăng ký Duende IdentityServer
    // Nó lo toàn bộ: cấp token, verify token, refresh token, revoke token...
    // ══════════════════════════════════════════════════
    builder.Services.AddIdentityServer(options =>
        {
            options.Events.RaiseErrorEvents = true;
            options.Events.RaiseSuccessEvents = true;
        })
        .AddInMemoryIdentityResources(IdentityServerConfig.IdentityResources) // Load cấu hình resources
        .AddInMemoryApiScopes(IdentityServerConfig.ApiScopes) // Load cấu hình scopes
        .AddInMemoryClients(IdentityServerConfig.Clients) // Load cấu hình clients
        .AddAspNetIdentity<AppUser>() // Kết nối Duende với ASP.NET Identity để nó dùng UserManager kiểm tra mật khẩu
        .AddDeveloperSigningCredential() // Tự sinh cặp khóa RSA (chỉ dùng trong môi trường dev)
        .AddProfileService<ProfileService>();

    builder.Services.AddLocalApiAuthentication();
    // Thêm cấu hình này để Cookie chạy được trên HTTP (Localhost)
    builder.Services.ConfigureApplicationCookie(options =>
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Tự động nhận diện HTTP hoặc HTTPS
    });
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddRazorPages(); // Thêm dòng này

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }


    app.UseStaticFiles();
    // ══════════════════════════════════════════════════
    // BƯỚC 4: Kích hoạt các Middleware theo đúng thứ tự
    // Thứ tự này CỰC KỲ quan trọng, sai thứ tự là lỗi ngay
    // ══════════════════════════════════════════════════
    app.UseIdentityServer(); // Kích hoạt Duende → tự tạo ra /connect/token, /.well-known/...
    app.UseAuthorization();
    app.MapControllers();
    app.MapRazorPages(); 

    // ══════════════════════════════════════════════════
    // BƯỚC 5: Tự động migrate DB và tạo dữ liệu mẫu khi khởi động
    // ══════════════════════════════════════════════════
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        db.Database.Migrate(); // Tự tạo bảng nếu chưa có
        
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<long>>>();
        await SeedDataExtensions.SeedUserAndRoleAsync(userManager, roleManager);
        
    }
    app.Run();
}
catch (Exception ex) {
    Log.Error(ex, "Identity Service failed to start");
}
finally{
    Log.Information("Identity Service is shutting down...");
    Log.CloseAndFlush();
}