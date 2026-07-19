using System;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class SubOrderStateMachine : MassTransitStateMachine<SubOrderSagaState>
{
    public State AwaitingConfirmation { get; private set; }
    public State Processing { get; private set; }
    public State Shipping { get; private set; }
    public State Delivered { get; private set; }

    // Events
    public Event<SubOrderCreatedEvent> SubOrderCreated { get; private set; }
    public Event<SubOrderConfirmedEvent> SubOrderConfirmed { get; private set; }
    public Event<SubOrderRejectedEvent> SubOrderRejected { get; private set; }
    public Event<SubOrderShippedEvent> SubOrderShipped { get; private set; }
    public Event<SubOrderDeliveredEvent> SubOrderDelivered { get; private set; }
    public Event<SubOrderCompletedEvent> SubOrderCompleted { get; private set; }

    public SubOrderStateMachine()
    {
        InstanceState(x => x.CurrentState);

        Event(() => SubOrderCreated, x => x.CorrelateById(context => context.Message.SubOrderId));
        Event(() => SubOrderConfirmed, x => x.CorrelateById(context => context.Message.SubOrderId));
        Event(() => SubOrderRejected, x => x.CorrelateById(context => context.Message.SubOrderId));
        Event(() => SubOrderShipped, x => x.CorrelateById(context => context.Message.SubOrderId));
        Event(() => SubOrderDelivered, x => x.CorrelateById(context => context.Message.SubOrderId));
        Event(() => SubOrderCompleted, x => x.CorrelateById(context => context.Message.SubOrderId));

        Initially(
            When(SubOrderCreated)
                .Then(context =>
                {
                    context.Instance.CorrelationId = context.Data.SubOrderId;
                    context.Instance.OrderId = context.Data.OrderId;
                    context.Instance.ShopId = context.Data.ShopId;
                })
                .TransitionTo(AwaitingConfirmation)
        );

        During(AwaitingConfirmation,
            When(SubOrderConfirmed)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Instance.CorrelationId,
                    Status = "Processing"
                }))
                .TransitionTo(Processing),

            When(SubOrderRejected)
                .Then(context => context.Instance.FailureReason = context.Data.Reason)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Instance.CorrelationId,
                    Status = "Cancelled",
                    FailureReason = context.Instance.FailureReason
                }))
                .PublishAsync(context => context.Init<RefundSubOrderRequest>(new RefundSubOrderRequest
                {
                    OriginalOrderId = context.Instance.OrderId,
                    SubOrderId = context.Instance.CorrelationId,
                    RefundAmount = context.Instance.TotalAmount
                }))
                .Finalize()
        );

        During(Processing,
            When(SubOrderShipped)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Instance.CorrelationId,
                    Status = "Shipping"
                }))
                .TransitionTo(Shipping),

            When(SubOrderRejected)
                .Then(context => context.Instance.FailureReason = context.Data.Reason)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Instance.CorrelationId,
                    Status = "Cancelled",
                    FailureReason = context.Instance.FailureReason
                }))
                .PublishAsync(context => context.Init<RefundSubOrderRequest>(new RefundSubOrderRequest
                {
                    OriginalOrderId = context.Instance.OrderId,
                    SubOrderId = context.Instance.CorrelationId,
                    RefundAmount = context.Instance.TotalAmount
                }))
                .Finalize()
        );

        During(Shipping,
            When(SubOrderDelivered)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Instance.CorrelationId,
                    Status = "Delivered"
                }))
                .Finalize()
        );

        SetCompletedWhenFinalized();
    }
}
