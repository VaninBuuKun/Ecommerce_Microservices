using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentFailedEvent : IIntegrationEvent
{
    public long OriginalOrderId { get; set; }
    public long CustomerId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
