using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Analytics.Api.Models.Entities;

public class ShopProductStats : EntityBase<long>
{
    public long ShopId { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public long? ParentCategoryId { get; set; }
    public int SoldQuantity { get; set; }
    public long Revenue { get; set; }
    public DateTimeOffset UpdatedDate { get; set; } = DateTimeOffset.UtcNow;
}
