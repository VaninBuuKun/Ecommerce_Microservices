using System;
using System.Linq;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class OrderStateMachine : MassTransitStateMachine<OrderSagaState>
{
    public State AwaitingPayment { get; private set; }
    
    // Event bên ngoài nhận vào
    public Event<OrderCreatedEvent> OrderCreated { get; private set; }
    public Event<PaymentCreatedEvent> PaymentCreated { get; private set; }
    public Event<PaymentSucceededEvent> PaymentSucceeded { get; private set; }
    public Event<PaymentFailedEvent> PaymentFailed { get; private set; }
    
    public OrderStateMachine()
    {
        InstanceState(x => x.CurrentState); 
        
        Event(() => OrderCreated, x => x.CorrelateById(context => context.Message.OrderId));
        Event(() => PaymentCreated, x => x.CorrelateById(context => context.Message.OrderId));
        Event(() => PaymentSucceeded, x => x.CorrelateById(context => context.Message.OrderId));
        Event(() => PaymentFailed, x => x.CorrelateById(context => context.Message.OrderId));
        
        Initially(
            When(OrderCreated)
                .Then(context =>
                {
                    context.Instance.CorrelationId = context.Data.OrderId;
                    context.Instance.CustomerId = context.Data.CustomerId;
                    context.Instance.TotalAmount = context.Data.TotalAmount;
                    context.Instance.PaymentMethodId = context.Data.PaymentMethodId;
                    context.Instance.ShippingAddress = context.Data.ShippingAddress;
                    // Lưu dưới dạng: VariantId:Quantity,VariantId:Quantity
                    context.Instance.SerializedVariantIds = string.Join(",", context.Data.OrderItems.Select(x => $"{x.VariantId}:{x.Quantity}"));
                })
                // 1. Xóa các sản phẩm đã mua khỏi giỏ hàng
                .PublishAsync(context => context.Init<RemoveCartItemsCommand>(new RemoveCartItemsCommand
                {
                    CustomerId = context.Instance.CustomerId,
                    VariantIds = context.Instance.SerializedVariantIds.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => Guid.Parse(x.Split(':')[0])).ToList()
                }))
                // 2. Nếu là COD (MethodId = 1) -> Xác nhận đơn hàng luôn
                .If(context => context.Instance.PaymentMethodId == 1, 
                    binder => binder
                        .PublishAsync(context => context.Init<OrderStatusChangedEvent>(new OrderStatusChangedEvent
                        {
                            OrderId = context.Instance.CorrelationId,
                            Status = "Confirmed"
                        }))
                        .Finalize())
                // 3. Nếu là Online Payment (Momo/VNPay) -> Chuyển thẳng sang trạng thái chờ thanh toán
                .If(context => context.Instance.PaymentMethodId != 1, 
                    binder => binder
                        .TransitionTo(AwaitingPayment))
        );
        
        During(AwaitingPayment,
            When(PaymentCreated)
                .Then(context => context.Instance.PaymentUrl = context.Data.PaymentUrl)
                .PublishAsync(context => context.Init<OrderStatusChangedEvent>(new OrderStatusChangedEvent()
                {
                    OrderId = context.Instance.CorrelationId,
                    Status = "PaymentAwaiting",
                    PaymentUrl = context.Data.PaymentUrl
                })),
                
            When(PaymentSucceeded)
                .PublishAsync(context => context.Init<OrderStatusChangedEvent>(new OrderStatusChangedEvent()
                {
                    OrderId = context.Instance.CorrelationId,
                    Status = "Confirmed"
                }))
                .Finalize(),
                
            When(PaymentFailed)
                .Then(context => context.Instance.FailureReason = context.Data.Reason)
                .PublishAsync(context => context.Init<OrderStatusChangedEvent>(new OrderStatusChangedEvent()
                {
                    OrderId = context.Instance.CorrelationId,
                    Status = "Cancelled",
                    FailureReason = context.Data.Reason
                }))
                // Giải phóng tồn kho (Compensating action)
                .PublishAsync(context => context.Init<ReleaseStocksRequest>(new ReleaseStocksRequest()
                {
                    OrderId = context.Instance.CorrelationId,
                    VariantItems = context.Instance.SerializedVariantIds.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Split(':'))
                        .Select(parts => new VariantStockData 
                        { 
                            VariantId = Guid.Parse(parts[0]), 
                            Quantity = int.Parse(parts[1]) 
                        }).ToList()
                }))
                .Finalize()
        );
        
        // Xóa dòng transaction trong db luôn khi Saga kết thúc (Finalized)
        SetCompletedWhenFinalized();
    }
}