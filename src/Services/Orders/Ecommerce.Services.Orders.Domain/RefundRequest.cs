using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Orders.Domain.Enums;
using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Domain;

public class RefundRequest : EntityTrackingBase<long>
{
    public long SubOrderId { get; private set; }
    public long CustomerId { get; private set; }
    public long ShopId { get; private set; }
    public string Reason { get; private set; } = null!;
    public string? Description { get; private set; }
    public string? ProofImagesJson { get; private set; }
    public decimal RequestedAmount { get; private set; }
    public int AttemptCount { get; private set; } = 1;
    public RefundStatus Status { get; private set; } = RefundStatus.Pending;
    public string? SellerRejectReason { get; private set; }
    public DateTimeOffset ExpirationDate { get; private set; }

    private readonly List<RefundRequestItem> _items = new();
    public IReadOnlyCollection<RefundRequestItem> Items => _items.AsReadOnly();

    public DisputeThread? DisputeThread { get; private set; }

    private RefundRequest() { }

    public RefundRequest(
        long subOrderId,
        long customerId,
        long shopId,
        string reason,
        string? description,
        string? proofImagesJson,
        decimal requestedAmount,
        DateTimeOffset expirationDate)
    {
        SubOrderId = subOrderId;
        CustomerId = customerId;
        ShopId = shopId;
        Reason = reason;
        Description = description;
        ProofImagesJson = proofImagesJson;
        RequestedAmount = requestedAmount;
        ExpirationDate = expirationDate;
        AttemptCount = 1;
        Status = RefundStatus.Pending;
    }

    public void AddItem(long subOrderItemId, int quantityToRefund, decimal unitPrice)
    {
        _items.Add(new RefundRequestItem(Id, subOrderItemId, quantityToRefund, unitPrice));
    }

    public void SellerApprove()
    {
        Status = RefundStatus.SellerApproved;
    }

    public void SellerReject(string rejectReason)
    {
        Status = RefundStatus.SellerRejected;
        SellerRejectReason = rejectReason;
    }

    public void Resubmit(string newReason, string? newDescription, string? newProofImagesJson, decimal newAmount)
    {
        if (AttemptCount >= 3)
        {
            throw new InvalidOperationException("Đã đạt giới hạn tối đa 3 lần gửi yêu cầu hoàn tiền.");
        }
        Reason = newReason;
        Description = newDescription;
        ProofImagesJson = newProofImagesJson;
        RequestedAmount = newAmount;
        AttemptCount += 1;
        Status = RefundStatus.Pending;
        ExpirationDate = DateTimeOffset.UtcNow.AddDays(2);
    }

    public void EscalateToDispute()
    {
        Status = RefundStatus.EscalatedToDispute;
    }

    public void ResolveByAdmin(bool approved)
    {
        Status = approved ? RefundStatus.AdminApproved : RefundStatus.AdminRejected;
    }
}
