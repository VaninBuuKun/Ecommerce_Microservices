using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Orders.Infrastructure.Extensions;
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
                    context.Saga.CorrelationId = context.Message.SubOrderId;
                    context.Saga.OrderId = context.Message.OrderId;
                    context.Saga.ShopId = context.Message.ShopId;
                    context.Saga.IsOnlinePayment = context.Message.IsOnlinePayment;
                    context.Saga.TotalAmount = context.Message.TotalAmount;
                    context.Saga.ShippingAddress = context.Message.ShippingAddress;
                    context.Saga.RecipientName = context.Message.RecipientName;
                    context.Saga.RecipientPhone = context.Message.RecipientPhone;
                    context.Saga.RecipientWardId = context.Message.RecipientWardId;
                    context.Saga.ItemsJson = JsonSerializer.Serialize(context.Message.OrderItems);
                })
                .TransitionTo(AwaitingConfirmation)
        );

        During(AwaitingConfirmation,
            When(SubOrderConfirmed)
                .TransitionTo(Processing),

            When(SubOrderRejected)
                .HandleRejectionFlow()
                .Finalize()
        );

        During(Processing,
            When(SubOrderShipped)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Saga.CorrelationId,
                    Status = "Shipping"
                }))
                .TransitionTo(Shipping),

            When(SubOrderRejected)
                .HandleRejectionFlow()
                .Finalize()
        );

        During(Shipping,
            When(SubOrderDelivered)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Saga.CorrelationId,
                    Status = "Delivered"
                }))
                .Finalize()
        );

        // SetCompletedWhenFinalized();
    }
}
