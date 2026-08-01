using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CalOrderGrandTotalResponse
{
    public string Id { get; set; }
    public Dictionary<long, decimal> ShopShippingFee { get; set; }
    public List<CheckoutShopGroupDto> ShopGroups { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal TotalShippingFee { get; set; }
    public decimal GrandTotal { get; set; }
}

public class CheckoutShopGroupDto
{
    public long ShopId { get; set; }
    public string ShopName { get; set; }
    public decimal ShippingFee { get; set; }
    public List<CheckoutItemDto> Items { get; set; } = new();
}

public class CheckoutItemDto
{
    public Guid VariantId { get; set; }
    public string ProductName { get; set; }
    public string VariantName { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}