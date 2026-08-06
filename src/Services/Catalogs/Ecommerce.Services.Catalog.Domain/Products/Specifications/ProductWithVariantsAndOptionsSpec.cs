using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductWithVariantsAndOptionsSpec : Specification<Product>, ISingleResultSpecification
{
    public ProductWithVariantsAndOptionsSpec(Guid Id)
    {
        Query.Where(product => product.Id == Id)
            .Include(product => product.Variants)
            .ThenInclude(variant => variant.VariantOptions)
            .Include(product => product.Options)
            .ThenInclude(option => option.Values);
    }
}