using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

public record UserPasswordChangedEvent : IIntegrationEvent
{
    public long UserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public DateTime ChangedAt { get; init; } = DateTime.UtcNow;
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
}
