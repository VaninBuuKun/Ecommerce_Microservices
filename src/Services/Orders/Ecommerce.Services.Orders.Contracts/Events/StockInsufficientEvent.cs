using System.Text;
using Ecommerce.Services.Carts.Contracts.Dtos;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class StockInsufficientEvent
{
    public Guid OrderId { get; set; }
    public List<VariantStockInsufficientData> VariantStockInsufficient { get; set; }

    public string GetFailureReason()
    {
        StringBuilder failureReason = new StringBuilder();
        foreach (var info in VariantStockInsufficient)
        {
            if (info.Quantity > info.Stocks)
            {
                failureReason.AppendLine($"Variant {info.VariantId} has insufficient stock. Requested: {info.Quantity}, Available: {info.Stocks}");
            }
        }
        
        return failureReason.ToString();
    }
}