using System;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class SubOrderSagaState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; } // MassTransit internal Saga Guid
    public long SubOrderId { get; set; }
    public long OrderId { get; set; } // Parent Order ID
    public string CurrentState { get; set; } = string.Empty;
    public long ShopId { get; set; }
    public long CustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedDate { get; set; }

    public bool IsOnlinePayment { get; set; } // false nếu cod
    public string? FailureReason { get; set; }
    public long? RefundRequestId { get; set; }
    public string? ItemsJson { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public long RecipientWardId { get; set; }

    public double Weight { get; set; }
    public double Height { get; set; }
    public double Width { get; set; }
    public double Length { get; set; }
}
