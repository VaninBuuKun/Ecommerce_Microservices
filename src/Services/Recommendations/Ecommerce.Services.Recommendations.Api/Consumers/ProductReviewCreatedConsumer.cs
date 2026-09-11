using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class ProductReviewCreatedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductReviewCreatedConsumer> logger)
    : IConsumer<ProductReviewCreatedEvent>
{
    public async Task Consume(ConsumeContext<ProductReviewCreatedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing ProductReviewCreatedEvent for Product {ProductId}, Rating {Rating}", msg.ProductId, msg.Rating);

        try
        {
            var product = await dbContext.MaterializedProducts
                .FirstOrDefaultAsync(p => p.ProductId == msg.ProductId, context.CancellationToken);

            if (product != null)
            {
                product.AverageRating = msg.NewAverageRating;
                product.ReviewCount = msg.NewReviewCount;
                product.LastSyncedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync(context.CancellationToken);

                // Evict cache
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:12", context.CancellationToken);
                await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing ProductReviewCreatedEvent for Product {ProductId}", msg.ProductId);
            throw;
        }
    }
}
