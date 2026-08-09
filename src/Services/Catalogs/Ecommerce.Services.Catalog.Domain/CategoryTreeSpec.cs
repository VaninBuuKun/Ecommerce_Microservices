using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain;

public class CategoryTreeSpec : Specification<Category>
{
    public CategoryTreeSpec()
    {
        Query.Where(cat => cat.ParentId == null && cat.IsActive == true)
             .Include(cat => cat.SubCategories);
    }
}
