using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderCompletedEvent
{
    public Guid SubOrderId { get; init; }
}
