using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductsWithVariantsAndOptionsSpec : Specification<Product>
{
    public ProductsWithVariantsAndOptionsSpec(int page = 1, int pageSize = 10)
    {
        Query.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(product => product.Variants)
            .ThenInclude(variant => variant.VariantOptions)
            .Include(product => product.Options)
            .ThenInclude(option => option.Values);
    }
}