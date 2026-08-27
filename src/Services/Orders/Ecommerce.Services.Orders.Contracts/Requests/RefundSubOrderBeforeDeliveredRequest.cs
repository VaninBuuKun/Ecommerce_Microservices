using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class RefundSubOrderBeforeDeliveredRequest
{
    public long SubOrderId { get; init; }
    public long CustomerId { get; init; }
    public decimal RefundAmount { get; init; }
    public string Reason { get; init; } = string.Empty;
    public long RefundRequestId { get; init; }
}
