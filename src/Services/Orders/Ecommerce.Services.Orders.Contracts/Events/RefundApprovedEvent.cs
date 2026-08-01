using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class RefundApprovedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; set; }
    public Guid RefundRequestId { get; set; }
    public long CustomerId { get; set; }
    public decimal RefundAmount { get; set; }
}
