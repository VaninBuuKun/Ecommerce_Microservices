using System;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Entities;
using Ecommerce.Services.Analytics.Api.Persistances;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Analytics.Api.Consumers;

public class RefundApprovedAnalyticsConsumer(
    AnalyticsDbContext dbContext,
    ILogger<RefundApprovedAnalyticsConsumer> logger)
    : IConsumer<RefundApprovedEvent>
{
    public async Task Consume(ConsumeContext<RefundApprovedEvent> context)
    {
        var msg = context.Message;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        logger.LogInformation("Processing RefundApprovedEvent for SubOrderId: {SubOrderId}, ShopId: {ShopId}, RefundAmount: {RefundAmount}",
            msg.SubOrderId, msg.ShopId, msg.RefundAmount);

        if (msg.ShopId <= 0)
        {
            logger.LogWarning("RefundApprovedEvent for SubOrderId: {SubOrderId} has no ShopId, skipping Shop refund count update.", msg.SubOrderId);
            return;
        }

        var refundVal = (long)Math.Round(msg.RefundAmount, MidpointRounding.AwayFromZero);

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
                CancelledOrderCount = 0,
                RefundedOrderCount = 1,
                RefundAmount = refundVal,
                UpdatedDate = DateTimeOffset.UtcNow
            });
        }
        else
        {
            shopStat.RefundedOrderCount += 1;
            shopStat.RefundAmount += refundVal;
            shopStat.UpdatedDate = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(context.CancellationToken);
        logger.LogInformation("Successfully updated RefundedOrderCount and RefundAmount for ShopId: {ShopId}", msg.ShopId);
    }
}
