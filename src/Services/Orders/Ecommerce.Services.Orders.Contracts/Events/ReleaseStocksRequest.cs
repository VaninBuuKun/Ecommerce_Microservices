using System;
using System.Collections.Generic;
using Ecommerce.Services.Carts.Contracts.Dtos;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class ReleaseStocksRequest
{
    public Guid OrderId { get; set; }
    public List<VariantStockData> VariantItems { get; set; } = new List<VariantStockData>();
}
