namespace Ecommerce.Services.Carts.Api.Models.Constansts;

public static class CartCacheKey
{
    public static string GetCartCacheKey(long customerId) => $"cart-{customerId}";
    public static string GetCartCacheKey(string customerId) => $"cart-{customerId}";
    
}
