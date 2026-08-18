namespace Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

public class VariantDto
{
    public Guid ProductId { get; set; }
    public Guid Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int AvailableStocks { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public long ShopId { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}