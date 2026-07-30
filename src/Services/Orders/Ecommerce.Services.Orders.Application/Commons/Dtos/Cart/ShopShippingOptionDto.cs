namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

public class ShopShippingOptionDto
{
    public long ShopId { get; init; }
    public string ShippingProvider { get; init; }
    public string ServiceCode { get; init; }
    public decimal ShippingFee { get; init; }
}