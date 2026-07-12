using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class RemoveCartItemsCommand
{
    public long CustomerId { get; set; }
    public List<Guid> VariantIds { get; set; } = new();
}
