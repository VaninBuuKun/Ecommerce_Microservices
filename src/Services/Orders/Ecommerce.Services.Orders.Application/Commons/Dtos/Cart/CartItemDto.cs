using System;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CartItemDto
{
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public long ShopId { get; set; }
    public int AvailableStock { get; set; }
    public int Weight { get; set; }
    public int Length { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}