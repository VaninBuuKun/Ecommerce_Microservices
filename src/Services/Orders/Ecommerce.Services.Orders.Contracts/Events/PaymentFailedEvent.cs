using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentFailedEvent : IIntegrationEvent
{
    public Guid OriginalOrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
