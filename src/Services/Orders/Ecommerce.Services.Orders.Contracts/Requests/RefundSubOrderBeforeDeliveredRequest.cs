using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class RefundSubOrderBeforeDeliveredRequest
{
    public Guid SubOrderId { get; init; }
    public long CustomerId { get; init; }
    public decimal RefundAmount { get; init; }
    public string Reason { get; init; }
    public Guid RefundRequestId { get; init; }
}
