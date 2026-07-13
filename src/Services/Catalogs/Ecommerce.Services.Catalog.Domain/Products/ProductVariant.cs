using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products.Rules;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class ProductVariant : EntityTrackingBase<Guid>
{
    public Guid ProductId { get; private set; }
    public string? Sku { get; private set; }
    public decimal Price { get; private set; }
    public int AvailableStocks { get; private set; }
    public int ReservedStocks { get; private set; }
    public bool IsDeleted { get; private set; }

    private readonly List<ProductVariantOption> _options = new();
    public IReadOnlyCollection<ProductVariantOption> Options => _options.AsReadOnly();
    public Product Product { get; private set; } = null!;

    private ProductVariant() { }

    internal ProductVariant(Guid productId, string? sku, decimal price, int availableStocks)
    {
        Check(new ProductPriceMustBePositiveRule(price));
        Check(new ProductStocksCannotBeNegativeRule(availableStocks));

        Id = Guid.NewGuid();
        ProductId = productId;
        Sku = sku;
        Price = price;
        AvailableStocks = availableStocks;
        ReservedStocks = 0;
        IsDeleted = false;
    }

    public void UpdatePrice(decimal newPrice)
    {
        Check(new ProductPriceMustBePositiveRule(newPrice));
        Price = newPrice;
    }

    public void UpdateDetails(string? sku, decimal price, int availableStocks)
    {
        Check(new ProductPriceMustBePositiveRule(price));
        Check(new ProductStocksCannotBeNegativeRule(availableStocks));
        Sku = sku;
        Price = price;
        AvailableStocks = availableStocks;
    }

    public void ReserveStock(int stock)
    {
        Check(new ProductStocksCannotBeNegativeRule(stock));
        ReservedStocks += stock;
        AvailableStocks -= stock;
    }
    
    public void ReleaseStock(int stock)
    {
        Check(new ProductStocksCannotBeNegativeRule(stock));
        ReservedStocks -= stock;
        AvailableStocks += stock;
    }

    public void AddOption(ProductVariantOption option)
    {
        _options.Add(option);
    }
    
    public void SoftDelete()
    {
        Check(new ProductVariantCannotHaveReservedStockRule(ReservedStocks));
        IsDeleted = true;
    }

    private void Check(IBusinessRule rule)
    {
        if (rule.IsBroken())
        {
            throw new DomainException(rule);
        }
    }


    public string GetVariantName()
    {
        List<string> names = _options.Select(o => o.OptionValue.Value).ToList();

        if (names.Count == 0)
        {
            return "No variants found";
        }
        return string.Join(", ", names);
    }
}
