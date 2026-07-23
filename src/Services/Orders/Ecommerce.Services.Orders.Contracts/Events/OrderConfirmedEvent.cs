using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class OrderConfirmedEvent : IIntegrationEvent
{
    public Guid OriginalOrderId { get; init; }
}