using BuildingBlocks.Shared.Domains;
using System;

namespace Ecommerce.Services.Orders.Domain;

public class DisputeMessage : EntityBase<long>
{
    public long DisputeThreadId { get; private set; }
    public long SenderUserId { get; private set; }
    public string SenderRole { get; private set; } = null!; // Customer, Seller, Admin
    public string Content { get; private set; } = null!;
    public string? AttachmentUrlsJson { get; private set; }
    public DateTimeOffset CreatedDate { get; private set; } = DateTimeOffset.UtcNow;

    private DisputeMessage() { }

    public DisputeMessage(long disputeThreadId, long senderUserId, string senderRole, string content, string? attachmentUrlsJson = null)
    {
        DisputeThreadId = disputeThreadId;
        SenderUserId = senderUserId;
        SenderRole = senderRole;
        Content = content;
        AttachmentUrlsJson = attachmentUrlsJson;
        CreatedDate = DateTimeOffset.UtcNow;
    }
}
