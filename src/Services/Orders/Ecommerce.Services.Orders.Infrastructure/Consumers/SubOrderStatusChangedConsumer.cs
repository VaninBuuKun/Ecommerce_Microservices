using Ecommerce.Services.Orders.Application.Features.Orders.Commands.UpdateOrderStatus;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MassTransit;
using MediatR;

namespace Ecommerce.Services.Orders.Infrastructure.Consumers;

public class SubOrderStatusChangedConsumer(ISender sender) : IConsumer<SubOrderStatusChangedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderStatusChangedEvent> context)
    {
        SubOrderStatus status = SubOrderStatus.Completed;
        switch (context.Message.Status)
        {
            case "Cancelled":
                status = SubOrderStatus.Cancelled;
                break;
            case "Delivered":
                status = SubOrderStatus.Delivered;
                break;
            case "AwaitingPayment":
                status = SubOrderStatus.AwaitingPayment;
                break;
            case "Processing":
                status = SubOrderStatus.Processing;
                break;
            case "Shipping":
                status = SubOrderStatus.Shipping;
                break;
        }
        
        await sender.Send(new UpdateSubOrderStatusCommand(context.Message.SubOrderId, status, context.Message.PaymentUrl), context.CancellationToken);
    }
}