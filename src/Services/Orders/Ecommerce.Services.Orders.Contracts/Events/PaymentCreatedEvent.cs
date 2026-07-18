using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentCreatedEvent
{
    public Guid OriginalOrderId { get; set; }
    public string? PaymentUrl { get; set; }
}
