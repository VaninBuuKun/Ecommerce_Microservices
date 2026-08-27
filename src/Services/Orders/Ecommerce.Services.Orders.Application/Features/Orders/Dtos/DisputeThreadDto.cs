using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class DisputeThreadDto
{
    public long Id { get; set; }
    public long RefundRequestId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset DeadlineDate { get; set; }
    public long? ResolvedByAdminId { get; set; }
    public string? ResolutionDecision { get; set; }
    public string? AdminNote { get; set; }
    public List<DisputeMessageDto> Messages { get; set; } = new();
    public DateTimeOffset CreatedDate { get; set; }
}

public class DisputeMessageDto
{
    public long Id { get; set; }
    public long DisputeThreadId { get; set; }
    public long SenderUserId { get; set; }
    public string SenderRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> AttachmentUrls { get; set; } = new();
    public DateTimeOffset CreatedDate { get; set; }
}
