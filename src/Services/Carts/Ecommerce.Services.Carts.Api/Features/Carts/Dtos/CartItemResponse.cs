namespace Ecommerce.Services.Carts.Api.Features.Carts.Dtos;

public class CartItemResponse
{
    public Guid ProductId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; }
    public string  VariantName  { get; set; }
    public int AvailableStocks { get; set; } 
    public bool IsSelected { get; set; }
}