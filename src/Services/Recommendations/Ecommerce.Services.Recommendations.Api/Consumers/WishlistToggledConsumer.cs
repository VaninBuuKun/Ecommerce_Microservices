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

public class WishlistToggledConsumer(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<WishlistToggledConsumer> logger)
    : IConsumer<WishlistToggledEvent>
{
    public async Task Consume(ConsumeContext<WishlistToggledEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing WishlistToggledEvent for User {UserId}, Product {ProductId}, IsAdded={IsAdded}", 
            msg.UserId, msg.ProductId, msg.IsAdded);

        try
        {
            var existing = await dbContext.UserWishlistItems
                .FirstOrDefaultAsync(w => w.UserId == msg.UserId && w.ProductId == msg.ProductId, context.CancellationToken);

            if (existing != null)
            {
                existing.IsActive = msg.IsAdded;
                existing.ToggledAt = msg.ToggledAt;
                if (msg.CategoryId.HasValue) existing.CategoryId = msg.CategoryId;
            }
            else if (msg.IsAdded)
            {
                var item = new UserWishlistItem
                {
                    UserId = msg.UserId,
                    ProductId = msg.ProductId,
                    CategoryId = msg.CategoryId,
                    IsActive = true,
                    ToggledAt = msg.ToggledAt
                };
                dbContext.UserWishlistItems.Add(item);
            }

            await dbContext.SaveChangesAsync(context.CancellationToken);

            // Invalidate user personalized recommendation cache
            await cacheService.RemoveAsync($"reco:for-you:u:{msg.UserId}:20", context.CancellationToken);
            await cacheService.RemoveAsync($"reco:for-you:u:{msg.UserId}:12", context.CancellationToken);

            logger.LogInformation("Successfully updated wishlist item for User {UserId}, Product {ProductId}", msg.UserId, msg.ProductId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing WishlistToggledEvent for User {UserId}, Product {ProductId}", msg.UserId, msg.ProductId);
            throw;
        }
    }
}
