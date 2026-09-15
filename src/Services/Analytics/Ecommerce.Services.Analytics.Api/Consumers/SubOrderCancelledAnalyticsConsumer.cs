using System;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Entities;
using Ecommerce.Services.Analytics.Api.Persistances;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Analytics.Api.Consumers;

public class SubOrderCancelledAnalyticsConsumer(
    AnalyticsDbContext dbContext,
    ILogger<SubOrderCancelledAnalyticsConsumer> logger)
    : IConsumer<SubOrderRejectedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderRejectedEvent> context)
    {
        var msg = context.Message;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        logger.LogInformation("Processing SubOrderRejectedEvent for SubOrderId: {SubOrderId}, ShopId: {ShopId}, Reason: {Reason}",
            msg.SubOrderId, msg.ShopId, msg.Reason);

        if (msg.ShopId <= 0)
        {
            logger.LogWarning("SubOrderRejectedEvent for SubOrderId: {SubOrderId} has no ShopId, skipping Shop cancelled count update.", msg.SubOrderId);
            return;
        }

        var shopStat = await dbContext.DailyShopRevenues
            .FirstOrDefaultAsync(r => r.ShopId == msg.ShopId && r.Date == today, context.CancellationToken);

        if (shopStat == null)
        {
            dbContext.DailyShopRevenues.Add(new DailyShopRevenue
            {
                ShopId = msg.ShopId,
                Date = today,
                Revenue = 0,
                OrderCount = 0,
                CompletedOrderCount = 0,
                CancelledOrderCount = 1,
                RefundedOrderCount = 0,
                RefundAmount = 0,
                UpdatedDate = DateTimeOffset.UtcNow
            });
        }
        else
        {
            shopStat.CancelledOrderCount += 1;
            shopStat.UpdatedDate = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(context.CancellationToken);
        logger.LogInformation("Successfully updated CancelledOrderCount for ShopId: {ShopId}", msg.ShopId);
    }
}
