namespace Ecommerce.Services.Orders.Contracts.Events;

public class OrderStatusChangedEvent
{
    public Guid OrderId { get; set; }
    public string Status { get; set; }
    public string? FailureReason { get; set; }
    public string? PaymentUrl { get; set; }
}