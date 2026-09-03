using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace BuildingBlocks.Shared.Events;

/// <summary>
/// Event phát sinh khi Admin hoàn tất duyệt và chuyển tiền cho yêu cầu rút tiền của Seller.
/// </summary>
public record WithdrawalCompletedEvent : IIntegrationEvent
{
    public Guid WithdrawalId { get; init; }
    public long UserId { get; init; }
    public decimal Amount { get; init; }
    public string BankName { get; init; } = string.Empty;
    public string BankAccountNumber { get; init; } = string.Empty;
    public string BankAccountHolder { get; init; } = string.Empty;
    public string? ProofImageUrl { get; init; }
    public string? AdminNote { get; init; }
    public DateTimeOffset CompletedAt { get; init; } = DateTimeOffset.UtcNow;
}
