using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class OrderSagaState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; }
    
    //Nếu không có thì masstransit k biết lưu state ở thuộc tính nào. Sẽ lỗi luôn.
    public string CurrentState { get; set; }
    public long CustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    
    public string FailureReason { get; set; }
}