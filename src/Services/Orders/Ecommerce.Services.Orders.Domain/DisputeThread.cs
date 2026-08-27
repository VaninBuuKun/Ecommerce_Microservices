using BuildingBlocks.Shared.Domains;
using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Domain;

public class DisputeThread : EntityTrackingBase<long>
{
    public long RefundRequestId { get; private set; }
    public DateTimeOffset DeadlineDate { get; private set; }
    public string Status { get; private set; } = "Active"; // Active, Resolved, Expired
    public long? ResolvedByAdminId { get; private set; }
    public string? ResolutionDecision { get; private set; } // AdminApproved, AdminRejected
    public string? AdminNote { get; private set; }

    private readonly List<DisputeMessage> _messages = new();
    public IReadOnlyCollection<DisputeMessage> Messages => _messages.AsReadOnly();

    public RefundRequest RefundRequest { get; private set; } = null!;

    private DisputeThread() { }

    public DisputeThread(long refundRequestId, DateTimeOffset deadlineDate)
    {
        RefundRequestId = refundRequestId;
        DeadlineDate = deadlineDate;
        Status = "Active";
    }

    public void AddMessage(long senderUserId, string senderRole, string content, string? attachmentUrlsJson = null)
    {
        if (Status != "Active")
        {
            throw new InvalidOperationException("Phòng tranh chấp này đã bị đóng.");
        }
        _messages.Add(new DisputeMessage(Id, senderUserId, senderRole, content, attachmentUrlsJson));
    }

    public void Resolve(long adminId, string decision, string? note)
    {
        Status = "Resolved";
        ResolvedByAdminId = adminId;
        ResolutionDecision = decision;
        AdminNote = note;
    }
}
