using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class ProductUpdatedEvent : IIntegrationEvent
{
    public long ProductId { get; init; }
    public long ShopId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public long? CategoryId { get; init; }
    public decimal Price { get; init; }
    public decimal DiscountPrice { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? AttributesJson { get; init; }
    public int Sold { get; init; }
    public double AverageRating { get; init; }
    public int ReviewCount { get; init; }
    public bool IsActive { get; init; }
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
}
