using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class RemoveCartItemsRequest
{
    public long CustomerId { get; set; }
    public List<Guid> VariantIds { get; set; } = new();
}
