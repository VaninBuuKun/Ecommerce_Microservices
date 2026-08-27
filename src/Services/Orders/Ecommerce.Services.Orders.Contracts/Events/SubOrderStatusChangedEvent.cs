using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class SubOrderStatusChangedEvent : IIntegrationEvent
{
    public long SubOrderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public string? PaymentUrl { get; set; }
}