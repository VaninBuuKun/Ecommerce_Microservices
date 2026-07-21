using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Ecommerce.Services.Carts.Contracts.Dtos;
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
                    context.Saga.CorrelationId = context.Message.SubOrderId;
                    context.Saga.OrderId = context.Message.OrderId;
                    context.Saga.ShopId = context.Message.ShopId;
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
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Saga.CorrelationId,
                    Status = "Processing"
                }))
                .PublishAsync(context => context.Init<CreateShipmentRequest>(new CreateShipmentRequest
                {
                    SubOrderId = context.Saga.CorrelationId,
                    OrderId = context.Saga.OrderId,
                    ShopId = context.Saga.ShopId,
                    SenderWardId = "010010001", // Placeholder, will be fetched via gRPC in Shipping Consumer
                    SenderAddress = "Shop Address Placeholder",
                    RecipientWardId = context.Saga.RecipientWardId,
                    RecipientAddress = context.Saga.ShippingAddress,
                    RecipientName = context.Saga.RecipientName,
                    RecipientPhone = context.Saga.RecipientPhone,
                    Weight = 1000, // 1kg default
                    Height = 10,
                    Width = 10,
                    Length = 10,
                    CodAmount = context.Saga.TotalAmount
                }))
                .TransitionTo(Processing),

            When(SubOrderRejected)
                .Then(context => context.Saga.FailureReason = context.Message.Reason)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Saga.CorrelationId,
                    Status = "Cancelled",
                    FailureReason = context.Saga.FailureReason
                }))
                .PublishAsync(context => context.Init<RefundSubOrderRequest>(new RefundSubOrderRequest
                {
                    OriginalOrderId = context.Saga.OrderId,
                    SubOrderId = context.Saga.CorrelationId,
                    RefundAmount = context.Saga.TotalAmount,
                    Reason = context.Message.Reason
                }))
                .PublishAsync(context =>
                {
                    var items = string.IsNullOrEmpty(context.Saga.ItemsJson)
                        ? new List<OrderItemData>()
                        : JsonSerializer.Deserialize<List<OrderItemData>>(context.Saga.ItemsJson);

                    return context.Init<ReleaseStocksRequest>(new ReleaseStocksRequest
                    {
                        OrderId = context.Saga.OrderId,
                        VariantItems = items?.Select(x => new VariantStockData
                        {
                            VariantId = x.VariantId,
                            Quantity = x.Quantity
                        }).ToList() ?? new List<VariantStockData>()
                    });
                })
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
                .Then(context => context.Saga.FailureReason = context.Message.Reason)
                .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
                {
                    SubOrderId = context.Saga.CorrelationId,
                    Status = "Cancelled",
                    FailureReason = context.Saga.FailureReason,
               }))
                .PublishAsync(context => context.Init<RefundSubOrderRequest>(new RefundSubOrderRequest
                {
                    OriginalOrderId = context.Saga.OrderId,
                    SubOrderId = context.Saga.CorrelationId,
                    RefundAmount = context.Saga.TotalAmount,
                    Reason = context.Message.Reason,
                }))
                .PublishAsync(context =>
                {
                    var items = string.IsNullOrEmpty(context.Saga.ItemsJson)
                        ? new List<OrderItemData>()
                        : JsonSerializer.Deserialize<List<OrderItemData>>(context.Saga.ItemsJson);

                    return context.Init<ReleaseStocksRequest>(new ReleaseStocksRequest
                    {
                        OrderId = context.Saga.OrderId,
                        VariantItems = items?.Select(x => new VariantStockData
                        {
                            VariantId = x.VariantId,
                            Quantity = x.Quantity
                        }).ToList() ?? new List<VariantStockData>()
                    });
                })
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

        SetCompletedWhenFinalized();
    }
}
