using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderDeliveredEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
}