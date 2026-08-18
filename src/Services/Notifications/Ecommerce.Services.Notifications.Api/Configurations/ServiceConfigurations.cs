using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Persistances;
using Ecommerce.Services.Notifications.Api.Services;

namespace Ecommerce.Services.Notifications.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IChatService, ChatService>();

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
