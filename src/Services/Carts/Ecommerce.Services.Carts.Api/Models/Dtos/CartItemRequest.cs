namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartItemRequest
{
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
}
