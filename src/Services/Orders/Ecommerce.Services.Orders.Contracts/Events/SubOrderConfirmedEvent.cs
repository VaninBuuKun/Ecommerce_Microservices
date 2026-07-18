using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderConfirmedEvent
{
    public Guid SubOrderId { get; init; }
    public Guid OriginalOrderId { get; init; }
    public long ShopId { get; init; }
}
