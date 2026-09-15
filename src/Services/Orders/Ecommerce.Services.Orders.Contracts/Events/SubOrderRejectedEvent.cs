using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderRejectedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
    public long ShopId { get; init; }
    public string Reason { get; init; } = string.Empty;
    public long? RefundRequestId { get; init; }
}