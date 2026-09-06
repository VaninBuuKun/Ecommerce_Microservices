using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductWithVariantsAndOptionsSpec : Specification<Product>, ISingleResultSpecification<Product>
{
    public ProductWithVariantsAndOptionsSpec(long id)
    {
        Query.Where(product => product.Id == id)
            .Include(product => product.Variants.Where(v => !v.IsDeleted))
            .ThenInclude(variant => variant.VariantOptions)
            .Include(product => product.Options.Where(option => !option.IsDeleted))
            .ThenInclude(option => option.Values.Where(value => !value.IsDeleted))
            .Include(product => product.Category)
            .ThenInclude(category => category!.Parent);
    }
}