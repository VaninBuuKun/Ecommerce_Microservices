namespace Ecommerce.Services.Carts.Contracts.Dtos;

public class OrderItemData
{
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; } = string.Empty;
}