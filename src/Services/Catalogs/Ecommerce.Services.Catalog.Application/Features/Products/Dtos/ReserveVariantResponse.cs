namespace Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

public class VariantStockInfo
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public int AvailableStocks { get; set; }
}

public class ReserveVariantResponse
{
    public bool IsSuccess { get; set; } = true;
    public List<VariantStockInfo> VariantStocks { get; set; } = new();
}