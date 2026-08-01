using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderRejectedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
    public string Reason { get; init; }
    public Guid? RefundRequestId { get; init; }
}