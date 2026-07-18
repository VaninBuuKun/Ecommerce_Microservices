using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class PayoutToSellerRequest
{
    public long SellerId { get; init; }
    public decimal Amount { get; init; }
    public Guid SubOrderId { get; init; }
}
