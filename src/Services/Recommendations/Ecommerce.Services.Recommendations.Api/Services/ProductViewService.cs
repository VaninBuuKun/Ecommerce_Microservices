using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Models.Dtos;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Ecommerce.Services.Recommendations.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Services;

public class ProductViewService(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<ProductViewService> logger)
    : IProductViewService
{
    public async Task<bool> TrackViewAsync(
        long? userId, 
        string? sessionId, 
        TrackProductViewRequest request, 
        CancellationToken cancellationToken = default)
    {
        if (request.ProductId <= 0) return false;

        var identifier = userId.HasValue ? $"u:{userId.Value}" : $"s:{sessionId ?? "anon"}";
        var throttleKey = $"view:throttle:{identifier}:{request.ProductId}";

        // Check throttle: 30 minutes cooldown
        try
        {
            var cached = await cacheService.GetAsync<string>(throttleKey, cancellationToken);
            if (cached != null)
            {
                // Throttled, skip database insert
                return false;
            }

            await cacheService.SetAsync(throttleKey, "1", TimeSpan.FromMinutes(30), cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis cache failure during view throttle check for {Key}", throttleKey);
        }

        // Get product to retrieve CategoryId and ShopId
        var product = await dbContext.MaterializedProducts
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == request.ProductId, cancellationToken);

        var productView = new ProductView
        {
            UserId = userId,
            SessionId = sessionId,
            ProductId = request.ProductId,
            CategoryId = product?.CategoryId,
            ShopId = product?.ShopId ?? 0,
            DurationSeconds = request.DurationSeconds,
            ViewedAt = DateTime.UtcNow
        };

        dbContext.ProductViews.Add(productView);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ProductViewStatsDto> GetProductViewStatsAsync(long productId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var dayAgo = now.AddHours(-24);
        var weekAgo = now.AddDays(-7);

        var totalViews = await dbContext.ProductViews
            .CountAsync(v => v.ProductId == productId, cancellationToken);

        var views24h = await dbContext.ProductViews
            .CountAsync(v => v.ProductId == productId && v.ViewedAt >= dayAgo, cancellationToken);

        var views7d = await dbContext.ProductViews
            .CountAsync(v => v.ProductId == productId && v.ViewedAt >= weekAgo, cancellationToken);

        return new ProductViewStatsDto
        {
            ProductId = productId,
            TotalViews = totalViews,
            ViewsLast24h = views24h,
            ViewsLast7Days = views7d
        };
    }
}
