using System.Threading.Tasks;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Services;

public interface INotificationJobService
{
    Task PurgeOldNotificationsAsync();
}

public class NotificationJobService(
    INotificationService notificationService,
    ILogger<NotificationJobService> logger) : INotificationJobService
{
    public async Task PurgeOldNotificationsAsync()
    {
        logger.LogInformation("Starting recurring job: Purging notifications older than 30 days...");
        var purged = await notificationService.PurgeOldNotificationsAsync(30);
        logger.LogInformation("Finished recurring job: Purged {Count} notifications older than 30 days", purged);
    }
}
