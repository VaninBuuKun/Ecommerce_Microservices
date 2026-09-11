using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class ProductStatusChangedEvent : IIntegrationEvent
{
    public long ProductId { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime ChangedAt { get; init; } = DateTime.UtcNow;
}
