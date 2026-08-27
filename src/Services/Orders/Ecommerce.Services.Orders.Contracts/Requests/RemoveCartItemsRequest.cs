using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class RemoveCartItemsRequest
{
    public long CustomerId { get; set; }
    public List<long> VariantIds { get; set; } = new();
}
