using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class VariantByIdWithProductAndOptionsSpec : Specification<ProductVariant>, ISingleResultSpecification
{
    public VariantByIdWithProductAndOptionsSpec(Guid id)
    {
        Query.Where(variant => variant.Id == id)
            .Include(variant => variant.VariantOptions)
                .ThenInclude(option => option.OptionValue)
                    .ThenInclude(optionValue => optionValue.Option)
            .Include(variant => variant.Product);
    }
}
