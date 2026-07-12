using Ecommerce.Services.Orders.Application.Features.Orders.Commands.UpdateOrderStatus;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using MassTransit;
using MediatR;

namespace Ecommerce.Services.Orders.Infrastructure.Consumers;

public class OrderStatusChangedConsumer(ISender sender) : IConsumer<OrderStatusChangedEvent>
{
    public async Task Consume(ConsumeContext<OrderStatusChangedEvent> context)
    {
        OrderStatus orderStatus = OrderStatus.Failed;
        switch (context.Message.Status)
        {
            case "Cancelled":
                orderStatus = OrderStatus.Cancelled;
                break;
            case "Delivered":
                orderStatus = OrderStatus.Delivered;
                break;
            case "PaymentAwaiting":
                orderStatus = OrderStatus.PaymentAwaiting;
                break;
            case "Confirmed":
                orderStatus = OrderStatus.Confirmed;
                break;
        }
        
        await sender.Send(new UpdateOrderStatusCommand(context.Message.OrderId, orderStatus, context.Message.PaymentUrl), context.CancellationToken);
    }
}