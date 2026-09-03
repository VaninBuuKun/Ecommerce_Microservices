using System;
using System.Globalization;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Yêu cầu rút tiền được duyệt & chuyển khoản thành công -> Gửi Email kèm ảnh chứng từ và thông báo in-app.
/// </summary>
public class WithdrawalCompletedNotificationConsumer(
    IEmailService emailService,
    INotificationService notificationService,
    IdentityGrpc.IdentityGrpcClient identityGrpcClient,
    ILogger<WithdrawalCompletedNotificationConsumer> logger
) : IConsumer<WithdrawalCompletedEvent>
{
    public async Task Consume(ConsumeContext<WithdrawalCompletedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Processing WithdrawalCompletedEvent for WithdrawalId {WithdrawalId}, User {UserId}, Amount {Amount}",
            message.WithdrawalId, message.UserId, message.Amount);

        string recipientEmail = string.Empty;
        string recipientName = "Quý đối tác";

        // 1. Lấy thông tin người dùng từ Identity.Api qua gRPC
        try
        {
            var userResponse = await identityGrpcClient.GetUserAsync(new GetUserRequest { UserId = message.UserId }, cancellationToken: context.CancellationToken);
            if (userResponse != null && userResponse.Found)
            {
                recipientEmail = userResponse.Email;
                var fullName = $"{userResponse.LastName} {userResponse.FirstName}".Trim();
                if (!string.IsNullOrWhiteSpace(fullName))
                {
                    recipientName = fullName;
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch user info via gRPC for User {UserId} in WithdrawalCompletedNotificationConsumer", message.UserId);
        }

        // 2. Gửi Email thông báo thành công kèm ảnh chứng từ chuyển khoản
        if (!string.IsNullOrEmpty(recipientEmail))
        {
            try
            {
                await emailService.SendWithdrawalSuccessEmailAsync(
                    recipientEmail,
                    recipientName,
                    message.Amount,
                    message.BankName,
                    message.BankAccountNumber,
                    message.BankAccountHolder,
                    message.ProofImageUrl,
                    message.AdminNote,
                    message.CompletedAt);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send withdrawal success email to {Email}", recipientEmail);
            }
        }

        // 3. Gửi thông báo in-app + SignalR
        var formattedAmount = message.Amount.ToString("N0", new CultureInfo("vi-VN"));
        var notification = new Notification
        {
            UserId = message.UserId,
            Title = "Rút tiền thành công 💸",
            Body = $"Yêu cầu rút {formattedAmount} VND về tài khoản {message.BankName} ({message.BankAccountNumber}) đã được chuyển khoản thành công.",
            Type = NotificationType.SystemAlert,
            ReferenceId = message.WithdrawalId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
