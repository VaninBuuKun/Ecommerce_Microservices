using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Services.Catalog.Api.Models.Dtos;

public class ProductRequest
{
    public string Name { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    
    public long ShopId { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}