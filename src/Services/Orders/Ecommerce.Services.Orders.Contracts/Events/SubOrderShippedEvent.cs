using System;

using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderShippedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
    public long OrderId { get; init; }
    public long CustomerId { get; init; }
}
