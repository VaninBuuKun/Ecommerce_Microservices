using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CheckoutSession
{
    public Guid CheckoutSessionId { get; set; }
    public long CustomerId { get; set; }
    public Guid UserAddressId { get; set; }
    public List<CheckoutSessionItem> Items { get; set; } = new();
    public Dictionary<long, CheckoutSessionShopShipping> ShopShippings { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal TotalShippingFee { get; set; }
    public decimal GrandTotal { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class CheckoutSessionItem
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class CheckoutSessionShopShipping
{
    public long ShopId { get; set; }
    public decimal ShippingFee { get; set; }
    public string ShippingProviderCode { get; set; }
}