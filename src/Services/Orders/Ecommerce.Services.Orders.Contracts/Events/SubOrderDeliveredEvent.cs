using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderDeliveredEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
}