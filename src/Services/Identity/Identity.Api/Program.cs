using BuildingBlocks.Logging.OTLPSerilog;
using Ecommerce.Services.Identity.Api.Configurations;
using Ecommerce.Services.Identity.Api.Services;
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
    
    // using (var scope = app.Services.CreateScope())
    // {
    //     var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    //     var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    //     db.Database.Migrate(); // Tự tạo bảng nếu chưa có
    //     
    //     var persistedGrantDb = scope.ServiceProvider.GetRequiredService<Duende.IdentityServer.EntityFramework.DbContexts.PersistedGrantDbContext>();
    //     persistedGrantDb.Database.Migrate();
    //     
    //     var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<long>>>();
    //     await SeedDataExtensions.SeedUserAndRoleAsync(userManager, roleManager);
    //     
    // }
    app.Run();
}
catch (Exception ex) {
    Log.Error(ex, "Identity Service failed to start");
}
finally{
    Log.Information("Identity Service is shutting down...");
    Log.CloseAndFlush();
}