using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class WishlistToggledEvent : IIntegrationEvent
{
    public long UserId { get; init; }
    public long ProductId { get; init; }
    public long? CategoryId { get; init; }
    public bool IsAdded { get; init; }
    public DateTime ToggledAt { get; init; } = DateTime.UtcNow;
}
