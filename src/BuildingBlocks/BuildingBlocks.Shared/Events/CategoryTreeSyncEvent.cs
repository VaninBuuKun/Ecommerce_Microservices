using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public class CategoryTreeSyncEvent : IIntegrationEvent
{
    public List<CategorySnapshotItem> Categories { get; init; } = new();
}

public class CategorySnapshotItem
{
    public long CategoryId { get; init; }
    public string Name { get; init; } = string.Empty;
    public long? ParentId { get; init; }
    public int Level { get; init; }
}
