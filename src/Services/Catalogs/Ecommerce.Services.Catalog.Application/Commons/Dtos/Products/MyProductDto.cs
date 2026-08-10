using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;


public class MyVariantDto
{
    public string VariantName  { get; set; }
    public decimal Price { get; set; }
    public long AvailableStock { get; set; }
    public string ThumbnailUrl { get; set; }
}
public class MyProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public string ThumbnailUrl { get; set; }
    public long AvailableStock { get; set; }
    public string Status { get; set; } = string.Empty;
    
    public List<MyVariantDto> Variants { get; set; }
}