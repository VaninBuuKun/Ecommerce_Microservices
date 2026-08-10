using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductWithVariantsAndOptionsSpec : Specification<Product>, ISingleResultSpecification
{
    public ProductWithVariantsAndOptionsSpec(Guid Id)
    {
        Query.Where(product => product.Id == Id)
            .Include(product => product.Variants.Where(v => !v.IsDeleted))
            .ThenInclude(variant => variant.VariantOptions)
            .Include(product => product.Options.Where(option => !option.IsDeleted))
            .ThenInclude(option => option.Values)
            .Include(product => product.Category)
            .ThenInclude(category => category!.Parent);
    }
}