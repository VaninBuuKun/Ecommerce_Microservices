using BuildingBlocks.Logging.OTLPSerilog;
using Ecommerce.Services.Notifications.Api.Configurations;
using Ecommerce.Services.Notifications.Api.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("NotificationService");
Log.Information("Notification Service starting......");

try
{
    builder.Services.AddControllers();

    builder.Services.AddOpenApi();

    // JWT Bearer — cho phép SignalR đọc token từ query string
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // SignalR gửi token qua query string thay vì header
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

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
