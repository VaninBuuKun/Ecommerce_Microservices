using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PaymentCreatedEvent
{
    public Guid OrderId { get; set; }
    public string? PaymentUrl { get; set; }
}
