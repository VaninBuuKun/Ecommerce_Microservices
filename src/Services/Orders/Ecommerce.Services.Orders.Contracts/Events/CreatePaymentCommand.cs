using System;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class CreatePaymentCommand
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public long PaymentMethodId { get; set; }
    public long CustomerId { get; set; }
}
