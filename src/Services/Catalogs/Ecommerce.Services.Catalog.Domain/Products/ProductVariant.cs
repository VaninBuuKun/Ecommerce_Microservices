using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products.Rules;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class ProductVariant : EntityTrackingBase<long>
{
    public long ProductId { get; private set; }
    public decimal Price { get; private set; }
    public int AvailableStock { get; private set; }
    public int ReservedStock { get; private set; }
    public bool IsDeleted { get; private set; }
    public decimal DiscountPrice { get; private set; }

    private readonly List<ProductVariantOption> _variantOptions = new();
    public IReadOnlyCollection<ProductVariantOption> VariantOptions => _variantOptions.AsReadOnly();
    public Product Product { get; private set; } = null!;

    private ProductVariant() { }

    internal ProductVariant(long productId, decimal price, int availableStock, decimal? discountPrice = null)
    {
        Check(new ProductStocksCannotBeNegativeRule(availableStock));

        ProductId = productId;
        Price = price;
        AvailableStock = availableStock;
        ReservedStock = 0;
        IsDeleted = false;
        DiscountPrice = discountPrice ?? Price;
    }

    public void UpdatePrice(decimal newPrice)
    {
        Check(new ProductPriceMustBePositiveRule(newPrice));
        Price = newPrice;
    }

    public void UpdateDetails(decimal price, int availableStock, decimal? discountPrice = null)
    {
        Price = price;
        AvailableStock = availableStock;
        DiscountPrice = discountPrice ?? Price;
    }

    public void ReserveStock(int stock)
    {
        Check(new ProductStocksCannotBeNegativeRule(stock));
        ReservedStock += stock;
        AvailableStock -= stock;
    }
    
    public void ReleaseStock(int stock)
    {
        Check(new ProductStocksCannotBeNegativeRule(stock));
        ReservedStock -= stock;
        AvailableStock += stock;
    }

    public void CommitStock(int stock)
    {
        Check(new ProductStocksCannotBeNegativeRule(stock));
        ReservedStock = Math.Max(0, ReservedStock - stock);
    }

    public void AddOption(ProductVariantOption option)
    {
        _variantOptions.Add(option);
    }
    
    public void SoftDelete()
    {
        Check(new ProductVariantCannotHaveReservedStockRule(ReservedStock));
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
        List<string> names = _variantOptions
            .OrderBy(o => o.OptionValue.Option.SortOrder)
            .ThenBy(o => o.OptionValue.SortOrder)
            .Select(o => o.OptionValue.Value)
            .ToList();

        if (names.Count == 0)
        {
            return string.Empty;
        }
        return string.Join(", ", names);
    }

    public string GetThumbnailUrl()
    {
        if (_variantOptions == null || !_variantOptions.Any())
        {
            return Product?.ThumbnailUrl ?? string.Empty;
        }

        var firstOptionValue = _variantOptions
            .Where(o => o.OptionValue?.Option != null && !o.OptionValue.Option.IsDeleted)
            .OrderBy(o => o.OptionValue.Option.SortOrder)
            .ThenBy(o => o.OptionValue.SortOrder)
            .Select(o => o.OptionValue)
            .FirstOrDefault();
        
        if (firstOptionValue == null || string.IsNullOrEmpty(firstOptionValue.ImageUrl))
        {
            return Product?.ThumbnailUrl ?? string.Empty;
        }

        return firstOptionValue.ImageUrl;
    }
}
