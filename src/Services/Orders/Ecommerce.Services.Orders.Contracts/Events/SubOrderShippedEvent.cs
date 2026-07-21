using System;

using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderShippedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
}
