using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

/// <summary>
/// Event phát sinh khi có yêu cầu gửi mã OTP khôi phục mật khẩu.
/// </summary>
public record ResetPasswordOtpRequestedEvent : IIntegrationEvent
{
    public long UserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string OtpCode { get; init; } = string.Empty;
    public DateTimeOffset RequestedAt { get; init; } = DateTimeOffset.UtcNow;
}
