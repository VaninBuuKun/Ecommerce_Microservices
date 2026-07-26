using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products.Rules;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class Product : AggregateRoot<Guid>
{
    public long ShopId { get; init; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public ProductStatus Status { get; private set; }

    // Navigation properties for EAV
    private readonly List<ProductOption> _options = new();
    public IReadOnlyCollection<ProductOption> Options => _options.AsReadOnly();

    private readonly List<ProductVariant> _variants = new();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.Where(v => !v.IsDeleted).ToList().AsReadOnly();

    public bool HasVariants => _variants.Any(v => !v.IsDeleted);

    private Product() { Name = null!; Description = null!; } // EF Core

    private Product(long shopId, string name, string description)
    {
        Check(new ProductNameCannotBeEmptyRule(name));

        Id = Guid.NewGuid();
        ShopId = shopId;
        Name = name;
        Description = description;
        Status = ProductStatus.Draft;
    }

    // ========== Update ==========

    public void UpdateDetails(string name, string description)
    {
        Check(new ProductNameCannotBeEmptyRule(name));
        Name = name;
        Description = description;
    }   

    // ========== Options & Option Values ==========

    public ProductOption AddOption(string name)
    {
        if (_options.Any(o => o.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException($"Option with name '{name} already exists.");
        }

        var productOption = new ProductOption(Id, name, _options.Count);
        _options.Add(productOption);

        return productOption;
    }

    /// <summary>
    /// Thêm một options value vào cuối
    /// </summary>
    /// <param name="optionId"></param>
    /// <param name="name"></param>
    /// <param name="sortOrder">Nếu </param>
    public ProductOptionValue AddOptionValue(Guid optionId, string value)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
                     ?? throw new ArgumentException($"Option ID {optionId} not found.");

        if (option.Values.Any(v => v.Value == value))
        {
            throw new InvalidOperationException($"Value '{value}' already exists in option '{option.Name}'.");
        }

        var productOptionValue = new ProductOptionValue(optionId, value, option.Values.Count);
        option.AddValue(productOptionValue);
        
        return productOptionValue;
    }

    // ========== Variants ==========

    public ProductVariant AddVariant(string? sku, decimal price, int availableStocks, List<Guid> optionValueIds)
    {
        Check(new ProductPriceMustBePositiveRule(price));
        Check(new ProductStocksCannotBeNegativeRule(availableStocks));
        
        // Validate that variant has exactly one option value from each option
        if (optionValueIds.Count != _options.Count)
        {
            throw new ArgumentException($"A variant must have exactly {_options.Count} option values.");
        }
        
        if (optionValueIds.Distinct().Count() != optionValueIds.Count)
        {
            throw new ArgumentException("Duplicate option value IDs are not allowed.");
        }

        foreach (var variant in _variants)
        {
            var Ids = variant.Options.Select(o => o.OptionValueId).ToList();

            if (new HashSet<Guid>(Ids).SetEquals(optionValueIds))
            {
                throw new InvalidOperationException("A variant with the same option values already exists.");  
            }
        }
        
        var createdVariant = new ProductVariant(Id, sku, price, availableStocks);
        foreach (var optionValueId in optionValueIds)
        {
            createdVariant.AddOption(new ProductVariantOption(createdVariant.Id, optionValueId));
        }
        
        _variants.Add(createdVariant);
        
        return createdVariant;
    }

    public void RemoveVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId && !v.IsDeleted)
                      ?? throw new InvalidOperationException("Variant not found or already deleted.");

        variant.SoftDelete();
    }

    public void ClearVariantsAndOptions()
    {
        foreach (var option in _options.Where(o => !o.IsDeleted))
        {
            option.SoftDelete();
        }
        foreach (var variant in _variants.Where(v => !v.IsDeleted))
        {
            variant.SoftDelete();
        }
    }

    // ========== Lifecycle ==========

    public void Activate()
    {
        this.Check(new ProductActiveHasAtLeastOneVariantRule(Variants));
        Status = ProductStatus.Active;
    }

    public void Deactivate()
    {
        Status = ProductStatus.Inactive;
    }

    // ========== Factory Methods ==========

    public static Product CreateNewProduct(long shopId, string name, string description)
    {
        return new Product(shopId, name, description);
    }
}
