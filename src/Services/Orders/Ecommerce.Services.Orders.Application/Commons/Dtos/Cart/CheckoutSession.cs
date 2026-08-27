using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CheckoutSession
{
    public Guid CheckoutSessionId { get; set; }
    public long CustomerId { get; set; }
    public long UserAddressId { get; set; }
    public List<CheckoutSessionItem> Items { get; set; } = new();
    public Dictionary<long, decimal> ShopShippingFees { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal TotalShippingFee { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal PlatformDiscount { get; set; }
    public Dictionary<long, decimal> ShopDiscounts { get; set; } = new();
    public string? PlatformVoucherCode { get; set; }
    public Dictionary<long, string> ShopVoucherCodes { get; set; } = new();
    public decimal GrandTotal { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class CheckoutSessionItem
{
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}