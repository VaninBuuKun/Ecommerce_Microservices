namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class ShopCheckoutGroupDto
{
    public long ShopId { get; init; }
    public List<CheckoutItemDto> Items { get; init; } = new();
    public ShopShippingOptionDto ShippingOption { get; init; }
}