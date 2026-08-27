using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CalOrderGrandTotalResponse
{
    public string Id { get; set; } = string.Empty;
    public Dictionary<long, decimal> ShopShippingFee { get; set; } = new();
    public List<CheckoutShopGroupDto> ShopGroups { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal TotalShippingFee { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal PlatformDiscount { get; set; }
    public decimal GrandTotal { get; set; }
}

public class CheckoutShopGroupDto
{
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public decimal ShippingFee { get; set; }
    public decimal SubTotalForShop { get; set; }
    public decimal ShopDiscount { get; set; }
    public string? VoucherCode { get; set; }
    public List<CheckoutItemDto> Items { get; set; } = new();
}

public class CheckoutItemDto
{
    public long VariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}