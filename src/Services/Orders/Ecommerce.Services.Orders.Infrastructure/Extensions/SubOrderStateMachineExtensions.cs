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
                        ProductId = x.ProductId,
                        VariantId = x.VariantId,
                        Quantity = x.Quantity
                    }).ToList() ?? new List<VariantStockData>()
                });
            })
            .PublishAsync(context => context.Init<SubOrderStatusChangedEvent>(new SubOrderStatusChangedEvent
            {
                SubOrderId = context.Saga.SubOrderId,
                Status = "Cancelled"
            }));
    }

    public static EventActivityBinder<SubOrderSagaState, PackageReadyEvent> HandlePackageReadyFlow(
        this EventActivityBinder<SubOrderSagaState, PackageReadyEvent> binder)
    {
        return binder
            .Then(context =>
            {
                context.Saga.Weight = context.Message.Weight;
                context.Saga.Height = context.Message.Height;
                context.Saga.Width = context.Message.Width;
                context.Saga.Length = context.Message.Length;
            })
            .PublishAsync(context =>
            {
                var items = string.IsNullOrEmpty(context.Saga.ItemsJson)
                    ? new List<OrderItemData>()
                    : JsonSerializer.Deserialize<List<OrderItemData>>(context.Saga.ItemsJson);

                var shipmentItems = items?.Select(x => new ShipmentItemData
                {
                    VariantId = x.VariantId,
                    Quantity = x.Quantity,
                    UnitPrice = x.UnitPrice,
                    ProductName = x.ProductName
                }).ToList() ?? new List<ShipmentItemData>();

                return context.Init<CreateShipmentRequest>(new CreateShipmentRequest
                {
                    SubOrderId = context.Saga.SubOrderId,
                    OrderId = context.Saga.OrderId,
                    CustomerId = context.Saga.CustomerId,
                    ShopId = context.Saga.ShopId,
                    RecipientName = context.Saga.RecipientName,
                    RecipientPhone = context.Saga.RecipientPhone,
                    RecipientAddress = context.Saga.ShippingAddress,
                    RecipientWardId = context.Saga.RecipientWardId,
                    Weight = context.Message.Weight,
                    Height = context.Message.Height,
                    Width = context.Message.Width,
                    Length = context.Message.Length,
                    CodAmount = context.Saga.IsOnlinePayment ? 0m : context.Saga.TotalAmount,
                    IsReturn = false,
                    Items = shipmentItems
                });
            });
    }
}