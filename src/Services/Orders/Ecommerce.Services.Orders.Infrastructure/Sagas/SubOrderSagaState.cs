using System;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class SubOrderSagaState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; } // = SubOrderId
    public Guid OrderId { get; set; } //Parent
    public string CurrentState { get; set; }
    public long ShopId { get; set; }
    public decimal TotalAmount { get; set; }

    public bool IsOnlinePayment { get; set; } // false nếu cod
    public string FailureReason { get; set; }
    public string? ItemsJson { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string RecipientWardId { get; set; } = string.Empty;
}

