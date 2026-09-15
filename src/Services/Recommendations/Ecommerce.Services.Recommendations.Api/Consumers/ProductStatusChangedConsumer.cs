using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class ProductStatusChangedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductStatusChangedConsumer> logger)
    : IConsumer<ProductStatusChangedEvent>
{
    public async Task Consume(ConsumeContext<ProductStatusChangedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing ProductStatusChangedEvent for Product {ProductId}: IsActive={IsActive}", msg.ProductId, msg.IsActive);

        try
        {
            var existing = await dbContext.MaterializedProducts
                .FirstOrDefaultAsync(p => p.ProductId == msg.ProductId, context.CancellationToken);

            if (existing != null)
            {
                existing.IsActive = msg.IsActive;
                existing.LastSyncedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(context.CancellationToken);

                // Evict cache
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:12", context.CancellationToken);
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:20", context.CancellationToken);
                await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing ProductStatusChangedEvent for Product {ProductId}", msg.ProductId);
            throw;
        }
    }
}
