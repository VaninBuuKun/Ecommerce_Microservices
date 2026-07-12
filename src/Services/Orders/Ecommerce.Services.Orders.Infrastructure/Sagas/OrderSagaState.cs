using MassTransit;

namespace Ecommerce.Services.Orders.Infrastructure.Sagas;

public class OrderSagaState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; }
    
    //Nếu không có thì masstransit k biết lưu state ở thuộc tính nào. Sẽ lỗi luôn.
    public string CurrentState { get; set; }
    public long CustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    public long PaymentMethodId { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string? PaymentUrl { get; set; }
    public string SerializedVariantIds { get; set; } = string.Empty;
    
    public string FailureReason { get; set; }
}