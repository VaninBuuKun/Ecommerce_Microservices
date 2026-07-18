namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderRejectedEvent
{
    public Guid SubOrderId { get; init; }
    public string Reason { get; init; }
}