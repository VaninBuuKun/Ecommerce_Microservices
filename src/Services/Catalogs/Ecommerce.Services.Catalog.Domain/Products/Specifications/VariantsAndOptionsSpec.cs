using System.Collections.Generic;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class VariantsAndOptionsSpec : Specification<ProductVariant>
{
    public VariantsAndOptionsSpec(List<long> variantIds)
    {
        Query.Where(variant => variantIds.Contains(variant.Id))
            .Include(variant => variant.VariantOptions)
            .ThenInclude(option => option.OptionValue)
            .ThenInclude(optionValue => optionValue.Option)
            .Include(variant => variant.Product);
    }
}