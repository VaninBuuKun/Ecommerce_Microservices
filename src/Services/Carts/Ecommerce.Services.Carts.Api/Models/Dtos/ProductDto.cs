namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class ProductDto
{
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
    public long ShopId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal AvailableStocks { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}