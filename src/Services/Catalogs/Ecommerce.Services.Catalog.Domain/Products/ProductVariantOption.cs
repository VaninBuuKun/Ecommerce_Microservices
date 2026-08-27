using System;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class ProductVariantOption
{
    public long VariantId { get; private set; }
    public long OptionValueId { get; private set; }

    public ProductVariant Variant { get; private set; } = null!;
    public ProductOptionValue OptionValue { get; private set; } = null!;

    private ProductVariantOption() { }

    public ProductVariantOption(long variantId, long optionValueId)
    {
        VariantId = variantId;
        OptionValueId = optionValueId;
    }
}
