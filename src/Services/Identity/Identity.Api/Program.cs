using System.Reflection;
using BuildingBlocks.Application;
using BuildingBlocks.Logging;

using Ecommerce.Services.Identity.Api.Configurations;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Ecommerce.Services.Identity.Api.Persistances;
using Ecommerce.Services.Identity.Api.Services;
using Identity.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("IdentityService");
// builder.AddCustomTracing("IdentityService");
Log.Information("Identity Service starting......");
try
{
    builder.Services.AddOpenApi();
    builder.Services.AddControllers();

    builder.Services.AddGrpc();
    builder.Services.AddScoped<IAddressService, AddressService>();

    builder.Services.ConfigureApplicationCookie(options =>
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Tự động nhận diện HTTP hoặc HTTPS
    });

    builder.Services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddInfrastructureConfiguration(builder.Configuration);

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }
    else
    {
        app.UseHttpsRedirection();
    }


    app.UseStaticFiles();
    app.UseCors("CorsPolicy");

    app.UseIdentityServer(); // Kích hoạt Duende → tự tạo ra /connect/token, /.well-known/...
    app.UseAuthorization();
    app.MapGrpcService<IdentityGrpcServer>();
    app.MapControllers();
    // ⚠️ Schema Migration đã được tách ra ngoài (SQL Script / EF Bundle)
    // KHÔNG gọi db.Database.Migrate() tại đây trong Production
    // Xem tài liệu: migration_seeding_strategy.md

    // Seed system data (Roles + Admin user) — Idempotent, đọc password từ ENV
    // using (var scope = app.Services.CreateScope())
    // {
    //     var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    //     var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<long>>>();
    //     var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    //     await SeedDataExtensions.SeedUserAndRoleAsync(userManager, roleManager, dbContext);
    // }

    app.Run();

}
catch (Exception ex)
{
    Console.WriteLine($"==========================================");
    Console.WriteLine($"CRITICAL STARTUP ERROR: {ex.Message}");
    Console.WriteLine(ex.ToString());
    Console.WriteLine($"==========================================");
    Log.Error(ex, "Identity Service failed to start");
}

finally
{
    Log.Information("Identity Service is shutting down...");
    Log.CloseAndFlush();
}