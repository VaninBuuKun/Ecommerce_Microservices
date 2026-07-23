using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderConfirmedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
    public Guid OriginalOrderId { get; init; }
    public long ShopId { get; init; }
}
