using System;

using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderShippedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
    public Guid OrderId { get; init; }
    public long CustomerId { get; init; }
}
