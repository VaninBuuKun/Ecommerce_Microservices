namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartItemRequest
{
    public long VariantId { get; set; }
    public int Quantity { get; set; }
}