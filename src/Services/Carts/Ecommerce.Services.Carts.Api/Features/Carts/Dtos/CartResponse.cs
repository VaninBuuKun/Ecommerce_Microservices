namespace Ecommerce.Services.Carts.Api.Features.Carts.Dtos;

public class CartResponse
{
    public long CustomerId { get; set; }
    public List<ShopCartGroupResponse> ShopGroups { get; set; } = new();
}

public class ShopCartGroupResponse
{
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public List<CartItemResponse> Items { get; set; } = new();
}