namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class CartItemDto
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
}