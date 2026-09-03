using BuildingBlocks.BackgroundJobs.Configurations;
using BuildingBlocks.Logging;

using Ecommerce.Services.Notifications.Api.Configurations;
using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
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

    // Hangfire Dashboard for Notifications
    app.UseBuildingBlocksHangfireDashboard("/hangfire");

    // Đăng ký Recurring Job tự động dọn dẹp notification cũ hơn 30 ngày chạy lúc 02:00 sáng mỗi ngày
    try
    {
        var backgroundJobs = app.Services.GetRequiredService<BuildingBlocks.Shared.InfrastructureInterfaces.BackgroundJobs.IBackgroundJobManager>();
        backgroundJobs.AddOrUpdateRecurring<Ecommerce.Services.Notifications.Api.Services.INotificationJobService>(
            "purge-old-notifications",
            x => x.PurgeOldNotificationsAsync(),
            "0 2 * * *"
        );
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Could not register Hangfire recurring job 'purge-old-notifications' on startup");
    }

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
