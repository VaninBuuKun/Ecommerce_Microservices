using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Recommendations.Api.Consumers;

public class CategorySyncConsumer(
    RecommendationDbContext dbContext,
    ILogger<CategorySyncConsumer> logger)
    : IConsumer<CategoryTreeSyncEvent>
{
    public async Task Consume(ConsumeContext<CategoryTreeSyncEvent> context)
    {
        var msg = context.Message;
        logger.LogInformation("Processing CategoryTreeSyncEvent with {Count} categories", msg.Categories.Count);

        try
        {
            foreach (var cat in msg.Categories)
            {
                var existing = await dbContext.MaterializedCategories
                    .FirstOrDefaultAsync(c => c.CategoryId == cat.CategoryId, context.CancellationToken);

                if (existing != null)
                {
                    existing.Name = cat.Name;
                    existing.ParentId = cat.ParentId;
                    existing.Level = cat.Level;
                }
                else
                {
                    dbContext.MaterializedCategories.Add(new MaterializedCategory
                    {
                        CategoryId = cat.CategoryId,
                        Name = cat.Name,
                        ParentId = cat.ParentId,
                        Level = cat.Level
                    });
                }
            }

            await dbContext.SaveChangesAsync(context.CancellationToken);
            logger.LogInformation("Successfully synced {Count} categories in Recommendation service", msg.Categories.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error syncing categories in Recommendation service");
            throw;
        }
    }
}
