using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// SubOrder chuyển sang trạng thái Shipping → notify buyer đơn hàng đang trên đường.
/// Bạn đã confirm: chỉ notify khi webhook shipping chuyển trạng thái "đưa đi vận chuyển".
/// </summary>
public class SubOrderShippedNotificationConsumer(
    INotificationService notificationService,
    ILogger<SubOrderShippedNotificationConsumer> logger
) : IConsumer<SubOrderShippedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderShippedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Sending shipped notification for SubOrder {SubOrderId}, Customer {CustomerId}",
            message.SubOrderId, message.CustomerId);

        var notification = new Notification
        {
            UserId = message.CustomerId,
            Title = "Đơn hàng đang được giao",
            Body = $"Đơn hàng của bạn đang trên đường đến. Mã vận đơn: {message.SubOrderId}",
            Type = NotificationType.SubOrderShipped,

            ReferenceId = message.SubOrderId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
