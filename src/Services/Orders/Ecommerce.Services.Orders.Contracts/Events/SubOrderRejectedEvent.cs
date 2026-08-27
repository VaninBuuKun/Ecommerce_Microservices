using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderRejectedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
    public string Reason { get; init; }
    public long? RefundRequestId { get; init; }
}