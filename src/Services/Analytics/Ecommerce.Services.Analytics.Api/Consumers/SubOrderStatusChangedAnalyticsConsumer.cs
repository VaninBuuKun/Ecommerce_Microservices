using System;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Persistances;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Analytics.Api.Consumers;

public class SubOrderStatusChangedAnalyticsConsumer(
    AnalyticsDbContext dbContext,
    ILogger<SubOrderStatusChangedAnalyticsConsumer> logger)
    : IConsumer<SubOrderStatusChangedEvent>
{
    public Task Consume(ConsumeContext<SubOrderStatusChangedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Observed SubOrderStatusChangedEvent: SubOrderId: {SubOrderId}, Status: {Status}",
            msg.SubOrderId, msg.Status);

        return Task.CompletedTask;
    }
}
