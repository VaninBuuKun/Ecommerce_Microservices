using System;

namespace Ecommerce.Services.Recommendations.Api.Models.Entities;

public class MaterializedProduct
{
    public long ProductId { get; set; }
    public long ShopId { get; set; }
    public long? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? AttributesJson { get; set; }
    public int Sold { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;
}
