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
    public string FailureReason { get; set; }
}
