namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderStatusChangedEvent
{
    public Guid SubOrderId { get; set; }
    public string Status { get; set; }
    public string? FailureReason { get; set; }
    public string? PaymentUrl { get; set; }
}