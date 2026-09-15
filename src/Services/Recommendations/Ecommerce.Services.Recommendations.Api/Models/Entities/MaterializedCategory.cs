namespace Ecommerce.Services.Recommendations.Api.Models.Entities;

public class MaterializedCategory
{
    public long CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long? ParentId { get; set; }
    public int Level { get; set; }
}
