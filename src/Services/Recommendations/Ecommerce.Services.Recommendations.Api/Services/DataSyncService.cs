using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Ecommerce.Services.Recommendations.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Ecommerce.Services.Recommendations.Api.Services;

public class DataSyncService(
    RecommendationDbContext dbContext,
    IConfiguration configuration,
    ILogger<DataSyncService> logger)
    : IDataSyncService
{
    public async Task<(int categoriesSynced, int productsSynced)> SyncFromCatalogAsync(CancellationToken cancellationToken = default)
    {
        var catalogConnStr = configuration.GetConnectionString("CatalogDb");
        if (string.IsNullOrWhiteSpace(catalogConnStr))
        {
            var recoConnStr = configuration.GetConnectionString("Database") ?? string.Empty;
            catalogConnStr = recoConnStr.Replace("Database=RecommendationDb", "Database=CatalogDb", StringComparison.OrdinalIgnoreCase);
        }

        logger.LogInformation("Starting on-demand sync from CatalogDb to RecommendationDb...");

        var categories = new List<MaterializedCategory>();
        var products = new List<MaterializedProduct>();

        await using (var conn = new NpgsqlConnection(catalogConnStr))
        {
            await conn.OpenAsync(cancellationToken);

            // 1. Fetch Categories
            const string categorySql = "SELECT \"Id\", \"Name\", \"ParentId\" FROM \"Categories\"";
            await using (var catCmd = new NpgsqlCommand(categorySql, conn))
            await using (var reader = await catCmd.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    var id = reader.GetInt32(0);
                    var name = reader.GetString(1);
                    int? parentId = reader.IsDBNull(2) ? null : reader.GetInt32(2);

                    categories.Add(new MaterializedCategory
                    {
                        CategoryId = id,
                        Name = name,
                        ParentId = parentId,
                        Level = parentId == null ? 1 : 2
                    });
                }
            }

            // 2. Fetch Products
            const string productSql = """
                SELECT "Id", "ShopId", "CategoryId", "Name", "Description", "Price", "DiscountPrice", 
                       "ThumbnailUrl", "AttributesJson", "Sold", "AverageRating", "ReviewCount", "Status" 
                FROM "Products"
            """;
            await using (var prodCmd = new NpgsqlCommand(productSql, conn))
            await using (var reader = await prodCmd.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    var id = reader.GetInt64(0);
                    var shopId = reader.GetInt32(1);
                    int? categoryId = reader.IsDBNull(2) ? null : reader.GetInt32(2);
                    var name = reader.GetString(3);
                    var description = reader.IsDBNull(4) ? null : reader.GetString(4);
                    var price = reader.GetDecimal(5);
                    var discountPrice = reader.GetDecimal(6);
                    var thumbnailUrl = reader.IsDBNull(7) ? null : reader.GetString(7);
                    var attributesJson = reader.IsDBNull(8) ? null : reader.GetString(8);
                    var sold = reader.GetInt32(9);
                    var averageRating = reader.GetDouble(10);
                    var reviewCount = reader.GetInt32(11);
                    var status = reader.GetString(12);

                    products.Add(new MaterializedProduct
                    {
                        ProductId = id,
                        ShopId = shopId,
                        CategoryId = categoryId,
                        Name = name,
                        Description = description,
                        Price = price,
                        DiscountPrice = discountPrice,
                        ThumbnailUrl = thumbnailUrl,
                        AttributesJson = attributesJson,
                        Sold = sold,
                        AverageRating = averageRating,
                        ReviewCount = reviewCount,
                        IsActive = string.Equals(status, "Active", StringComparison.OrdinalIgnoreCase),
                        LastSyncedAt = DateTime.UtcNow
                    });
                }
            }
        }

        // Upsert categories
        foreach (var cat in categories)
        {
            var existing = await dbContext.MaterializedCategories.FindAsync([cat.CategoryId], cancellationToken);
            if (existing != null)
            {
                existing.Name = cat.Name;
                existing.ParentId = cat.ParentId;
                existing.Level = cat.Level;
            }
            else
            {
                await dbContext.MaterializedCategories.AddAsync(cat, cancellationToken);
            }
        }

        // Upsert products
        foreach (var prod in products)
        {
            var existing = await dbContext.MaterializedProducts.FindAsync([prod.ProductId], cancellationToken);
            if (existing != null)
            {
                existing.ShopId = prod.ShopId;
                existing.CategoryId = prod.CategoryId;
                existing.Name = prod.Name;
                existing.Description = prod.Description;
                existing.Price = prod.Price;
                existing.DiscountPrice = prod.DiscountPrice;
                existing.ThumbnailUrl = prod.ThumbnailUrl;
                existing.AttributesJson = prod.AttributesJson;
                existing.Sold = prod.Sold;
                existing.AverageRating = prod.AverageRating;
                existing.ReviewCount = prod.ReviewCount;
                existing.IsActive = prod.IsActive;
                existing.LastSyncedAt = DateTime.UtcNow;
            }
            else
            {
                await dbContext.MaterializedProducts.AddAsync(prod, cancellationToken);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Data sync finished: {Categories} categories, {Products} products synced.", 
            categories.Count, products.Count);

        return (categories.Count, products.Count);
    }
}
