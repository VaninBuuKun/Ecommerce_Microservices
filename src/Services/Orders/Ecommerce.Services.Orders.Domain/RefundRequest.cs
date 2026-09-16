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
    public RefundStatus Status { get; private set; } = RefundStatus.Pending;
    public string? SellerRejectReason { get; private set; }
    public DateTimeOffset ExpirationDate { get; private set; }

    private readonly List<RefundRequestItem> _items = new();
    public IReadOnlyCollection<RefundRequestItem> Items => _items.AsReadOnly();

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

    public void Cancel()
    {
        Status = RefundStatus.Cancelled;
    }
}
