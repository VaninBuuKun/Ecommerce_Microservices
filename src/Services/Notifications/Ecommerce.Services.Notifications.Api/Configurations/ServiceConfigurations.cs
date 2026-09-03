using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Persistances;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;

namespace Ecommerce.Services.Notifications.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ITemplateRenderer, TemplateRenderer>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<INotificationJobService, NotificationJobService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IEmailService, EmailService>();

        // SignalR — dùng JWT Bearer để authenticate connection
        // Client phải gửi token qua query string: ?access_token=...
        // vì WebSocket không hỗ trợ header Authorization
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true;
        });

        // Cho phép SignalR đọc JWT từ query string
        services.AddAuthentication(options =>
        {
            // Giữ nguyên scheme đã cấu hình bởi AddBuildingBlocsAuth
        });
    }
}
