using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Services.Catalog.Api.Models.Dtos;

public class ProductRequest
{
    public string Name { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    
    public long ShopId { get; set; }
}