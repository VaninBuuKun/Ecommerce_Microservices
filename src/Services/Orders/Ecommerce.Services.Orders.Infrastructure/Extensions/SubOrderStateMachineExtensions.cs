using System.Text.Json;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Orders.Infrastructure.Sagas;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Extensions;

public static class SubOrderStateMachineExtensions
{
    public static EventActivityBinder<SubOrderSagaState, SubOrderRejectedEvent> HandleRejectionFlow(
        this EventActivityBinder<SubOrderSagaState, SubOrderRejectedEvent> binder)
    {
        return binder
            .Then(context => 
            {
                context.Saga.FailureReason = context.Message.Reason;
                context.Saga.RefundRequestId = context.Message.RefundRequestId;
            })
            .If(context => context.Saga.IsOnlinePayment && context.Saga.CurrentState != "Shipping", b => b
                .PublishAsync(context => context.Init<RefundSubOrderBeforeDeliveredRequest>(new RefundSubOrderBeforeDeliveredRequest
                {
                    CustomerId = context.Saga.CustomerId,
                    RefundAmount = context.Saga.TotalAmount,
                    Reason = context.Message.Reason,
                    RefundRequestId = context.Saga.RefundRequestId ?? 0
                }))
            )
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
            });
    }
}