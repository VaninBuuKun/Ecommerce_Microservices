using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products.Rules;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class Product : AggregateRoot<Guid>
{
    public long ShopId { get; init; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public ProductStatus Status { get; private set; }
    public double Weight { get; private set; }
    public double Length { get; private set; }
    public double Width { get; private set; }
    public double Height { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public string? VideoUrl { get; private set; }
    public List<string> ImageUrls { get; private set; } = new();
    
    // Phân cấp Category
    public Guid? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    
    // Giá sản phẩm (min price của các variants hoặc giá của single variant)
    public decimal Price { get; private set; }
    public decimal DiscountPrice { get; private set; }
    public int AvailableStock { get; private set; }

    // Thông tin Ratings & Reviews (2NF)
    public double AverageRating { get; private set; }
    public int ReviewCount { get; private set; }
    public int RatingSum { get; private set; }

    // Navigation properties for EAV
    private readonly List<ProductOption> _options = new();
    public IReadOnlyCollection<ProductOption> Options => _options.AsReadOnly();

    private readonly List<ProductVariant> _variants = new();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.Where(v => !v.IsDeleted).ToList().AsReadOnly();

    public bool HasVariants => _variants.Any(v => !v.IsDeleted);

    // Dịch vụ Images & Reviews
    public ICollection<ProductImage> Images { get; private set; } = new List<ProductImage>();
    public ICollection<ProductReview> Reviews { get; private set; } = new List<ProductReview>();

    private Product() { Name = null!; Description = null!; } // EF Core

    private Product(long shopId, string name, string description, string thumbnailUrl, double weight, double length, double width, double height)
    {
        Check(new ProductNameCannotBeEmptyRule(name));

        Id = Guid.NewGuid();
        ShopId = shopId;
        Name = name;
        Description = description;
        Status = ProductStatus.Active;
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
        ThumbnailUrl = thumbnailUrl;
    }

    // ========== Update ==========

    public void UpdateDetails(string name, string description, string? thumbnailUrl, string? videoUrl, List<string> imageUrls)
    {
        Check(new ProductNameCannotBeEmptyRule(name));
        Name = name;
        Description = description;
        ThumbnailUrl = thumbnailUrl;
        VideoUrl = videoUrl;
        ImageUrls = imageUrls ?? new List<string>();
    }

    public void UpdateShippingDimensions(double weight, double length, double width, double height)
    {
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
    }

    // ========== Options & Option Values ==========

    public ProductOption AddOption(string name)
    {
        if (_options.Any(o => !o.IsDeleted && o.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException($"Option with name '{name}' already exists.");
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

    public ProductVariant AddVariant(decimal price, int availableStocks, List<Guid> optionValueIds, double weight = 0, double length = 0, double width = 0, double height = 0, decimal? discountPrice = null)
    {
        Check(new ProductPriceMustBePositiveRule(price));
        Check(new ProductStocksCannotBeNegativeRule(availableStocks));
        
        // Validate that variant has exactly one option value from each option
        var activeOptionsCount = _options.Count(o => !o.IsDeleted);
        if (optionValueIds.Count != activeOptionsCount)
        {
            throw new ArgumentException($"A variant must have exactly {activeOptionsCount} option values.");
        }
        
        if (optionValueIds.Distinct().Count() != optionValueIds.Count)
        {
            throw new ArgumentException("Duplicate option value IDs are not allowed.");
        }

        foreach (var variant in _variants)
        {
            var Ids = variant.VariantOptions.Select(o => o.OptionValueId).ToList();

            if (new HashSet<Guid>(Ids).SetEquals(optionValueIds))
            {
                throw new InvalidOperationException("A variant with the same option values already exists.");  
            }
        }
        
        var createdVariant = new ProductVariant(Id, price, availableStocks, weight, length, width, height, discountPrice);
        foreach (var optionValueId in optionValueIds)
        {
            createdVariant.AddOption(new ProductVariantOption(createdVariant.Id, optionValueId));
        }
        
        _variants.Add(createdVariant);
        SyncProductPrice();
        
        return createdVariant;
    }

    public void RemoveVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId && !v.IsDeleted)
                      ?? throw new InvalidOperationException("Variant not found or already deleted.");

        variant.SoftDelete();
        SyncProductPrice();
    }

    public void SyncProductPrice()
    {
        if (Variants.Any())
        {
            Price = Variants.Min(v => v.Price);
            DiscountPrice = Variants.Min(v => v.DiscountPrice);
            AvailableStock = Variants.Sum(v => v.AvailableStocks);
        }
    }

    public void UpdateSingleProductInfo(decimal price, decimal discountPrice, int availableStock)
    {
        Price = price;
        DiscountPrice = discountPrice;
        AvailableStock = availableStock;
    }

    public void UpdatePrice(decimal price, decimal? discountPrice = null)
    {
        Price = price;
        DiscountPrice = discountPrice ?? price;
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

    public void SetCategory(Guid? categoryId)
    {
        CategoryId = categoryId;
    }

    public void UpdateRatings(int newReviewRating)
    {
        var totalRatingSum = (AverageRating * ReviewCount) + newReviewRating;
        ReviewCount += 1;
        AverageRating = Math.Round((double)totalRatingSum / ReviewCount, 1);
    }
    // ========== Factory Methods ==========

    public static Product CreateNewProduct(long shopId, string name, string description, string thumbnailUrl, double weight = 0, double length = 0, double width = 0, double height = 0)
    {
        return new Product(shopId, name, description, thumbnailUrl, weight, length, width, height);
    }

    public void UpdateSaleInfo(int availableStock, double weight, double length, double width, double height,
        decimal price, decimal? discountPrice = null)
    {
        AvailableStock = availableStock;
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
        Price = price;
        DiscountPrice = discountPrice ?? price;
    }
}
