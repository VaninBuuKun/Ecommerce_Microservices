using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class ProductReviewCreatedEvent : IIntegrationEvent
{
    public long ReviewId { get; init; }
    public long ProductId { get; init; }
    public long UserId { get; init; }
    public int Rating { get; init; }
    public double NewAverageRating { get; init; }
    public int NewReviewCount { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
