using System.Collections.Generic;

namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartResponse
{
    public long CustomerId { get; set; }
    public List<ShopCartGroupResponse> ShopGroups { get; set; } = [];
}

public class ShopCartGroupResponse
{
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public List<CartItemResponse> Items { get; set; } = [];
}

public class CartItemResponse
{
    public long ProductId { get; set; }
    public long ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public int AvailableStocks { get; set; }
    public long ShopId { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}
