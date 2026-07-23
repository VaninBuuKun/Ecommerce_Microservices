using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderCompletedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
}
