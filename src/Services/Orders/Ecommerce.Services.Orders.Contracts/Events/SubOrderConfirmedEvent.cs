using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderConfirmedEvent : IIntegrationEvent
{
    public long SubOrderId { get; init; }
}
