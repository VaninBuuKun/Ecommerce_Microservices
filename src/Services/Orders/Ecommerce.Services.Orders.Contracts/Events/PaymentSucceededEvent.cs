using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentSucceededEvent : IIntegrationEvent
{
    public Guid OrderId { get; set; }
}
