namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderDeliveredEvent
{
    public Guid SubOrderId { get; private set; }
}