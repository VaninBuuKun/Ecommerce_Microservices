using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderCompletedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; init; }
    public long ShopId { get; init; }
    public decimal TotalAmount { get; init; }
}
