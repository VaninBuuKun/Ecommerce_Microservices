using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class OrderStateMachine : MassTransitStateMachine<OrderSagaState>
{
    public State ReservingStock { get; private set; }
    
    //Event bên ngoài nhận vào tức là mình là consumer(k phải cái command).
    public Event<OrderCreatedEvent> OrderCreated { get; private set; }
    public Event<StockReservedEvent> StockReserved { get; private set; }
    public Event<StockInsufficientEvent>  StockInsufficient { get; private set; }
    
    public OrderStateMachine()
    {
        InstanceState(x => x.CurrentState); 
        Event(() => OrderCreated, x => x.CorrelateById(context => context.Message.OrderId));
        Event(() => StockReserved, x => x.CorrelateById(context => context.Message.OrderId));   
        Event(() => StockInsufficient, x => x.CorrelateById(context => context.Message.OrderId));
        
        //Nếu mà masstransit xuống db mà k có dòng nào thì sẽ gọi vào đây (chỉ tạo khi mà nhận các sự kiện trong init).
        Initially(
            When(OrderCreated)
                .Then(context =>
                {
                    context.Instance.CorrelationId = context.Data.OrderId;
                    context.Instance.CustomerId = context.Data.CustomerId;
                    context.Instance.TotalAmount = context.Data.TotalAmount;
                })
                .PublishAsync(context => context.Init<ReserveStocksRequest>(new ReserveStocksRequest()
                    {
                        OrderId = context.Data.OrderId,
                        VariantItems = context.Message.OrderItems.Select(item => new VariantStockData()
                        {
                            VariantId = item.VariantId,
                            Quantity = item.Quantity
                        }).ToList()
                    }))
                .TransitionTo(ReservingStock)
        );
        
        During(ReservingStock, 
            When (StockReserved)
                .PublishAsync(context => context.Init<OrderStatusChangedEvent>(new OrderStatusChangedEvent()
                {
                    OrderId = context.Data.OrderId,
                    Status = OrderStatus.Delivered,
                }))
                .Finalize(),
            When(StockInsufficient)
                .Then<OrderSagaState, StockInsufficientEvent>(ctx => ctx.Instance.FailureReason = ctx.Data.GetFailureReason())
                .PublishAsync(ctx => ctx.Init<OrderStatusChangedEvent>(
                    new OrderStatusChangedEvent()
                    {
                        OrderId = ctx.Data.OrderId,
                        Status = OrderStatus.Cancelled
                    }
                )).Finalize()
            );
        
        //Xóa dòng transaction trong db luôn.
        SetCompletedWhenFinalized();
    }
    
}