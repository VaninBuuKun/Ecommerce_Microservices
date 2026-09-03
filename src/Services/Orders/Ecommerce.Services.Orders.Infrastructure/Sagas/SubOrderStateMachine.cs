using System;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Infrastructure.Extensions;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class SubOrderStateMachine : MassTransitStateMachine<SubOrderSagaState>
{
    // States
    public State AwaitingPayment { get; private set; }
    public State AwaitingConfirmation { get; private set; }
    public State Processing { get; private set; }
    public State Shipping { get; private set; }
    public State Delivered { get; private set; }
    public State Completed { get; private set; }
    public State Cancelled { get; private set; }
    public State Refunded { get; private set; }

    // Events
    public Event<SubOrderCreatedEvent> SubOrderCreated { get; private set; }
    public Event<SubOrderConfirmedEvent> SubOrderConfirmed { get; private set; }
    public Event<SubOrderRejectedEvent> SubOrderRejected { get; private set; }
    public Event<PackageReadyEvent> SubOrderPackageReady { get; private set; }
    public Event<SubOrderShippedEvent> SubOrderShipped { get; private set; }
    public Event<SubOrderDeliveredEvent> SubOrderDelivered { get; private set; }
    public Event<SubOrderCompletedEvent> SubOrderCompleted { get; private set; }
    public Event<RefundApprovedEvent> RefundApproved { get; private set; }

    public SubOrderStateMachine()
    {
        InstanceState(x => x.CurrentState);

        Event(() => SubOrderCreated, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId).SelectId(context => NewId.NextGuid()));
        Event(() => SubOrderConfirmed, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => SubOrderRejected, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => SubOrderPackageReady, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => SubOrderShipped, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => SubOrderDelivered, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => SubOrderCompleted, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));
        Event(() => RefundApproved, x => x.CorrelateBy((s, context) => s.SubOrderId == context.Message.SubOrderId));

        Initially(
            When(SubOrderCreated)
                .Then(context =>
                {
                    context.Saga.SubOrderId = context.Message.SubOrderId;
                    context.Saga.OrderId = context.Message.OrderId;
                    context.Saga.CustomerId = context.Message.CustomerId;
                    context.Saga.ShopId = context.Message.ShopId;
                    context.Saga.TotalAmount = context.Message.TotalAmount;
                    context.Saga.IsOnlinePayment = context.Message.IsOnlinePayment;
                    context.Saga.CreatedDate = DateTime.UtcNow;
                    context.Saga.ItemsJson = System.Text.Json.JsonSerializer.Serialize(context.Message.OrderItems);
                    context.Saga.ShippingAddress = context.Message.ShippingAddress;
                    context.Saga.RecipientName = context.Message.RecipientName;
                    context.Saga.RecipientPhone = context.Message.RecipientPhone;
                    context.Saga.RecipientWardId = context.Message.RecipientWardId;
                })
                .TransitionTo(AwaitingConfirmation)
        );

        During(AwaitingConfirmation,
            When(SubOrderConfirmed)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Message.SubOrderId,
                    Status = "Processing"
                }))
                .TransitionTo(Processing),
            When(SubOrderRejected)
                .HandleRejectionFlow()
                .TransitionTo(Cancelled)
        );

        During(Processing,
            When(SubOrderPackageReady)
                .HandlePackageReadyFlow(),
            When(SubOrderShipped)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Message.SubOrderId,
                    Status = "Shipping"
                }))
                .TransitionTo(Shipping),
            When(SubOrderRejected)
                .HandleRejectionFlow()
                .TransitionTo(Cancelled)
        );
        
        During(Shipping,
            When(SubOrderDelivered)
                //Kích hoạt bg job để tự động hoàn tất đơn hàng sau 7 ngày
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Message.SubOrderId,
                    Status = "Delivered"
                }))
                .TransitionTo(Delivered),
            When(SubOrderRejected)
                .HandleRejectionFlow()
                .TransitionTo(Cancelled)
        );

        During(Delivered,
            When(SubOrderCompleted)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Message.SubOrderId,
                    Status = "Completed"
                }))
                .TransitionTo(Completed),
            When(RefundApproved)
                .TransitionTo(Refunded)
        );
    }
}
