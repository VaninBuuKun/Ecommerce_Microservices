using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Domain;

public class Category : EntityTrackingBase<long>
{
    public string Name { get; private set; }
    public string Description { get; private set; }
    public long? ParentId { get; private set; }
    public string? IconUrl { get; private set; }
    public bool IsActive { get; private set; }

    public Category? Parent { get; private set; }
    public ICollection<Category> SubCategories { get; private set; } = new List<Category>();
    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private Category() { Name = null!; Description = null!; }

    public Category(string name, string? description, string? iconUrl, long? parentId = null)
    {
        Name = name;
        ParentId = parentId;
        Description = description ?? string.Empty;
        IconUrl = iconUrl;
        IsActive = true;
    }

    public void Update(string name, string? description, string? iconUrl, long? parentId)
    {
        if (parentId == Id)
        {
            throw new InvalidOperationException("Danh mục cha không được trùng với danh mục hiện tại.");
        }

        Name = name;
        ParentId = parentId;
        Description = description ?? string.Empty;
        IconUrl = iconUrl;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }
}
