using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Đăng ký tài khoản thành công -> gửi Email chào mừng và thông báo in-app.
/// </summary>
public class UserRegisteredNotificationConsumer(
    IEmailService emailService,
    INotificationService notificationService,
    ILogger<UserRegisteredNotificationConsumer> logger
) : IConsumer<UserRegisteredEvent>
{
    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Processing UserRegisteredEvent for User {UserId}, Email {Email}",
            message.UserId, message.Email);

        // 1. Gửi Email chào mừng
        try
        {
            await emailService.SendWelcomeEmailAsync(message.Email, message.FullName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send welcome email to {Email}", message.Email);
        }

        // 2. Gửi In-app notification + SignalR
        var notification = new Notification
        {
            UserId = message.UserId,
            Title = "Chào mừng bạn gia nhập Ecommerce! 🎉",
            Body = $"Xin chào {message.FullName}, chúc bạn có những trải nghiệm mua sắm tuyệt vời tại hệ thống của chúng tôi.",
            Type = NotificationType.SystemAlert,
            ReferenceId = message.UserId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
