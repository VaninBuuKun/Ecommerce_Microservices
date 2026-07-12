namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CartItemDetailDto
{
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; }
    public string VariantName { get; set; }
    public int AvailableStocks { get; set; }
}