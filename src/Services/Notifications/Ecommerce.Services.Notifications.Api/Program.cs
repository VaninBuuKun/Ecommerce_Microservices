using BuildingBlocks.Logging;

using Ecommerce.Services.Notifications.Api.Configurations;
using Ecommerce.Services.Notifications.Api.Hubs;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("NotificationService");
Log.Information("Notification Service starting......");

try
{
    builder.Services.AddControllers();

    builder.Services.AddOpenApi();

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

    app.UseCors("CorsPolicy");
    app.UseAuthentication();
    app.UseAuthorization();

    // SignalR Hub
    app.MapHub<NotificationHub>("/hubs/notification");

    app.MapControllers();
    app.Run();
}
catch (Exception ex)
{
    Log.Error(ex, "Notification Service failed to start");
}
finally
{
    Log.Information("Notification Service is shutting down...");
    Log.CloseAndFlush();
}
