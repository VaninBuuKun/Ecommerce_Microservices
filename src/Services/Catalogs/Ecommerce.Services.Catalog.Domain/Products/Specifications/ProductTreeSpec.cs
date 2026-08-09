using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductTreeSpec : Specification<Product>
{
    public ProductTreeSpec(long shopId, int size = 10, int page = 1, string searchTerm = "")
    {
        Query.Include(product => product.Variants.Where(v => v.IsDeleted == false))
            .ThenInclude(v => v.VariantOptions)
            .ThenInclude(vo => vo.OptionValue)
            .ThenInclude(ov => ov.Option)
            .Where(product => product.ShopId == shopId)
            .Skip((page - 1) * size)
            .Take(size);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            Query.Where(product => product.Name.Contains(searchTerm));
        }
    }
}