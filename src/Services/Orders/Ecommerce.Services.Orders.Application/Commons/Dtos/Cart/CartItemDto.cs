using System;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CartItemDto
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; }
    public string VariantName { get; set; }
    public decimal UnitPrice { get; set; }
    public long ShopId { get; set; }
    public int AvailableStocks { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string ThumbnailUrl { get; set; }
}