using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentSucceededEvent : IIntegrationEvent
{
    public long OrderId { get; set; }
    public long CustomerId { get; set; }
}
