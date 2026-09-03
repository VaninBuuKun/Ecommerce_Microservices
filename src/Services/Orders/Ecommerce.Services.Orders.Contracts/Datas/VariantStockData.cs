namespace Ecommerce.Services.Orders.Contracts.Requests;

public class VariantStockData
{
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
}