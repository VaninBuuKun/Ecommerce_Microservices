namespace Ecommerce.Services.Orders.Contracts.Events;

public class OrderConfirmedEvent
{
    public Guid OriginalOrderId { get; init; }
}