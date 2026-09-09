namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class ProductDto
{
    public long ProductId { get; set; }
    public long VariantId { get; set; }
    public long ShopId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public int Weight { get; set; }
    public int Length { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}
