namespace Ecommerce.Services.Carts.Api.Features.Carts.Dtos;

public class CartItemResponse
{
    public long ProductId { get; set; }
    public long ProductVariantId { get; set; }
    public long ShopId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public int AvailableStocks { get; set; } 
    public bool IsSelected { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}