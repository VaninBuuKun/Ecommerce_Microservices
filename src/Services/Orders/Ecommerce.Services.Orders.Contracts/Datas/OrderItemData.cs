namespace Ecommerce.Services.Carts.Contracts.Dtos;

public class OrderItemData
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}