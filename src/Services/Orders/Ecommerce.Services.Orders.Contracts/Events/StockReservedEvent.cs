namespace Ecommerce.Services.Orders.Contracts.Events;

public class StockReservedEvent
{
    public Guid OrderId { get; set; }
}