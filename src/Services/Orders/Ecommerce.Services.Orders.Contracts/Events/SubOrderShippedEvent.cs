using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderShippedEvent
{
    public Guid SubOrderId { get; init; }
}
