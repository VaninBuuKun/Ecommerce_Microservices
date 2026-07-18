using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class CreatePaymentRequest
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public long PaymentMethodId { get; set; }
    public long CustomerId { get; set; }
}
