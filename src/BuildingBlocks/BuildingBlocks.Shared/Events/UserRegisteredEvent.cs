using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

/// <summary>
/// Event phát sinh khi người dùng đăng ký tài khoản thành công.
/// </summary>
public record UserRegisteredEvent : IIntegrationEvent
{
    public long UserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public DateTimeOffset RegisteredAt { get; init; } = DateTimeOffset.UtcNow;
}
