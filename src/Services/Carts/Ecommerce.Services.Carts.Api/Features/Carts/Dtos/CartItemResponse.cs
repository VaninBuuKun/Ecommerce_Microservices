namespace Ecommerce.Services.Carts.Api.Features.Carts.Dtos;

public class CartItemResponse
{
    public Guid ProductId { get; set; }
    public Guid ProductVariantId { get; set; }
    public long ShopId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string  VariantName  { get; set; } = string.Empty;
    public int AvailableStocks { get; set; } 
    public bool IsSelected { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}