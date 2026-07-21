using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class RefundSubOrderRequest
{
    public Guid OriginalOrderId { get; init; }
    public Guid SubOrderId { get; init; }
    public decimal RefundAmount { get; init; }
    public string Reason { get; init; }
}
