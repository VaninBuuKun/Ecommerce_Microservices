using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class ProductDeletedEvent : IIntegrationEvent
{
    public long ProductId { get; init; }
    public long ShopId { get; init; }
    public DateTime DeletedAt { get; init; } = DateTime.UtcNow;
}
