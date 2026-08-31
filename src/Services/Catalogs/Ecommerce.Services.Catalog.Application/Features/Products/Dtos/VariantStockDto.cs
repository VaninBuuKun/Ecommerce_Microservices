namespace Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

public class VariantStockDto
{
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
}
