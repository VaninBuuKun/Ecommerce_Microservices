using System;
using System.Collections.Generic;
using Ecommerce.Services.Carts.Contracts.Dtos;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class ReleaseStocksRequest : IIntegrationEvent
{
    public long OrderId { get; set; }
    public List<VariantStockData> VariantItems { get; set; } = new List<VariantStockData>();
}
