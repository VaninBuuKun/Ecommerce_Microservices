using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class ProductUpdatedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductUpdatedConsumer> logger)
    : IConsumer<ProductUpdatedEvent>
{
    public async Task Consume(ConsumeContext<ProductUpdatedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing ProductUpdatedEvent for Product {ProductId}", msg.ProductId);

        try
        {
            var existing = await dbContext.MaterializedProducts
                .FirstOrDefaultAsync(p => p.ProductId == msg.ProductId, context.CancellationToken);

            if (existing != null)
            {
                existing.ShopId = msg.ShopId;
                existing.CategoryId = msg.CategoryId;
                existing.Name = msg.Name;
                existing.Description = msg.Description;
                existing.Price = msg.Price;
                existing.DiscountPrice = msg.DiscountPrice;
                existing.ThumbnailUrl = msg.ThumbnailUrl;
                existing.AttributesJson = msg.AttributesJson;
                existing.Sold = msg.Sold;
                existing.AverageRating = msg.AverageRating;
                existing.ReviewCount = msg.ReviewCount;
                existing.IsActive = msg.IsActive;
                existing.LastSyncedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync(context.CancellationToken);

                // Invalidate specific product recommendation cache
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:12", context.CancellationToken);
                await cacheService.RemoveAsync($"reco:similar:{msg.ProductId}:20", context.CancellationToken);
                await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);

                logger.LogInformation("Successfully updated materialized product {ProductId}", msg.ProductId);
            }
            else
            {
                // Product was not materialized yet, create it
                var product = new MaterializedProduct
                {
                    ProductId = msg.ProductId,
                    ShopId = msg.ShopId,
                    CategoryId = msg.CategoryId,
                    Name = msg.Name,
                    Description = msg.Description,
                    Price = msg.Price,
                    DiscountPrice = msg.DiscountPrice,
                    ThumbnailUrl = msg.ThumbnailUrl,
                    AttributesJson = msg.AttributesJson,
                    Sold = msg.Sold,
                    AverageRating = msg.AverageRating,
                    ReviewCount = msg.ReviewCount,
                    IsActive = msg.IsActive,
                    LastSyncedAt = DateTime.UtcNow
                };
                dbContext.MaterializedProducts.Add(product);
                await dbContext.SaveChangesAsync(context.CancellationToken);
                logger.LogInformation("Created missing materialized product {ProductId} from update event", msg.ProductId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating materialized product {ProductId}", msg.ProductId);
            throw;
        }
    }
}
