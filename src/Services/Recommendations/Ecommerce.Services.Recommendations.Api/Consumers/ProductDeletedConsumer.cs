using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class ProductDeletedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductDeletedConsumer> logger)
    : IConsumer<ProductDeletedEvent>
{
    public async Task Consume(ConsumeContext<ProductDeletedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing ProductDeletedEvent for Product {ProductId}", msg.ProductId);

        try
        {
            var existing = await dbContext.MaterializedProducts
                .FirstOrDefaultAsync(p => p.ProductId == msg.ProductId, context.CancellationToken);

            if (existing != null)
            {
                // Soft-delete in recommendation view (deactivate) or remove
                existing.IsActive = false;
                existing.LastSyncedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(context.CancellationToken);

                // Evict cache
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:12", context.CancellationToken);
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:20", context.CancellationToken);
                await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);

                logger.LogInformation("Deactivated materialized product {ProductId}", msg.ProductId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing ProductDeletedEvent for Product {ProductId}", msg.ProductId);
            throw;
        }
    }
}
