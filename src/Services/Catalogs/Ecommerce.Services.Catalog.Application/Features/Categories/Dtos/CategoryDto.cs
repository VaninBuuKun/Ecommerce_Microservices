namespace Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;

public class CategoryDto
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public long? ParentId { get; set; }
    public string? IconUrl { get; set; }
    public List<CategoryDto> SubCategories { get; set; } = new();
}