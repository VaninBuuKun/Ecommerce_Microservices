using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

/// <summary>
/// Event phát sinh khi phát hiện đăng nhập từ thiết bị / vị trí mới.
/// </summary>
public record NewDeviceLoginAlertEvent : IIntegrationEvent
{
    public long UserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string DeviceName { get; init; } = string.Empty;
    public string IpAddress { get; init; } = string.Empty;
    public DateTimeOffset LoginTime { get; init; } = DateTimeOffset.UtcNow;
}
