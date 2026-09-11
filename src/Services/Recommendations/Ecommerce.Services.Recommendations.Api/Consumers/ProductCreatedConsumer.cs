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

public class ProductCreatedConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductCreatedConsumer> logger)
    : IConsumer<ProductCreatedEvent>
{
    public async Task Consume(ConsumeContext<ProductCreatedEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing ProductCreatedEvent for Product {ProductId}: {Name}", msg.ProductId, msg.Name);

        try
        {
            var existing = await dbContext.MaterializedProducts
                .FirstOrDefaultAsync(p => p.ProductId == msg.ProductId, context.CancellationToken);

            if (existing == null)
            {
                existing = new MaterializedProduct
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
                dbContext.MaterializedProducts.Add(existing);
            }
            else
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
            }

            await dbContext.SaveChangesAsync(context.CancellationToken);

            // Invalidate trending cache
            await cacheService.RemoveAsync("reco:trending:20", context.CancellationToken);
            await cacheService.RemoveAsync("reco:trending:12", context.CancellationToken);

            logger.LogInformation("Successfully materialized product {ProductId}", msg.ProductId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error materializing ProductCreatedEvent for Product {ProductId}", msg.ProductId);
            throw;
        }
    }
}
