using Ecommerce.Services.Carts.Contracts.Dtos;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class ReserveStocksRequest
{
    public Guid OrderId { get; set; }
    public List<VariantStockData> VariantItems { get; set; } = new List<VariantStockData>();
}