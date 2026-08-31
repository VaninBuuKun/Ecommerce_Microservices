using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Yêu cầu OTP khôi phục mật khẩu -> gửi Email mã OTP và thông báo in-app.
/// </summary>
public class ResetPasswordOtpNotificationConsumer(
    IEmailService emailService,
    INotificationService notificationService,
    ILogger<ResetPasswordOtpNotificationConsumer> logger
) : IConsumer<ResetPasswordOtpRequestedEvent>
{
    public async Task Consume(ConsumeContext<ResetPasswordOtpRequestedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Processing ResetPasswordOtpRequestedEvent for User {UserId}, Email {Email}",
            message.UserId, message.Email);

        // 1. Gửi Email mã OTP
        try
        {
            await emailService.SendResetPasswordOtpEmailAsync(message.Email, message.OtpCode);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send reset password OTP email to {Email}", message.Email);
        }

        // 2. Gửi In-app notification + SignalR
        var notification = new Notification
        {
            UserId = message.UserId,
            Title = "Yêu cầu mã OTP khôi phục mật khẩu 🔒",
            Body = $"Mã OTP đặt lại mật khẩu đã được gửi đến email {message.Email}. Vui lòng kiểm tra hộp thư của bạn.",
            Type = NotificationType.SystemAlert,
            ReferenceId = message.UserId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
