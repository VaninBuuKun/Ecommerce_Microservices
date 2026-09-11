using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class SubOrderCompletedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<SubOrderCompletedConsumer> logger)
    : IConsumer<SubOrderCompletedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderCompletedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing SubOrderCompletedEvent for SubOrder {SubOrderId}, Customer {CustomerId}", msg.SubOrderId, msg.CustomerId);

        if (msg.Items == null || !msg.Items.Any())
        {
            logger.LogWarning("SubOrderCompletedEvent {SubOrderId} has no items.", msg.SubOrderId);
            return;
        }

        try
        {
            var productIds = msg.Items.Select(i => i.ProductId).Where(id => id > 0).Distinct().ToList();
            var products = await dbContext.MaterializedProducts
                .Where(p => productIds.Contains(p.ProductId))
                .ToDictionaryAsync(p => p.ProductId, context.CancellationToken);

            foreach (var item in msg.Items)
            {
                if (item.ProductId <= 0) continue;

                products.TryGetValue(item.ProductId, out var product);

                // Add to purchase history
                if (msg.CustomerId > 0)
                {
                    var history = new UserPurchaseHistory
                    {
                        UserId = msg.CustomerId,
                        ProductId = item.ProductId,
                        CategoryId = item.CategoryId ?? product?.CategoryId,
                        ShopId = msg.ShopId,
                        Quantity = item.Quantity,
                        PurchasedAt = DateTime.UtcNow
                    };
                    dbContext.UserPurchaseHistories.Add(history);
                }

                // Increment sold counter on materialized product
                if (product != null)
                {
                    product.Sold += item.Quantity;
                    product.LastSyncedAt = DateTime.UtcNow;
                }
            }

            await dbContext.SaveChangesAsync(context.CancellationToken);

            // Invalidate user personalized recommendation cache
            if (msg.CustomerId > 0)
            {
                await cacheService.RemoveAsync($"reco:for-you:u:{msg.CustomerId}:20", context.CancellationToken);
                await cacheService.RemoveAsync($"reco:for-you:u:{msg.CustomerId}:12", context.CancellationToken);
            }

            // Invalidate trending
            await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);

            logger.LogInformation("Successfully recorded purchase history for SubOrder {SubOrderId}", msg.SubOrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing SubOrderCompletedEvent for SubOrder {SubOrderId}", msg.SubOrderId);
            throw;
        }
    }
}
