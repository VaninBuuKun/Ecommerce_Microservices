using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products.Rules;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class Product : AggregateRoot<long>
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
    public long? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    
    // Giá sản phẩm (min price của các variants hoặc giá của single variant)
    public decimal Price { get; private set; }
    public decimal MaxPrice { get; private set; }
    public decimal DiscountPrice { get; private set; }
    public int Sold { get; private set; }
    public string? AttributesJson { get; private set; }
    public string SearchDocument { get; private set; } = string.Empty;

    // Thông tin Ratings & Reviews (2NF)
    public double AverageRating { get; private set; }
    public int ReviewCount { get; private set; }
    public int RatingSum { get; private set; }

    // Date tracking
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties for EAV
    private readonly List<ProductOption> _options = new();
    public IReadOnlyCollection<ProductOption> Options => _options.AsReadOnly();

    private readonly List<ProductVariant> _variants = new();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.Where(v => !v.IsDeleted).ToList().AsReadOnly();

    public bool HasVariants => _variants.Any(v => !v.IsDeleted);

    // Dịch vụ Images & Reviews
    public ICollection<ProductReview> Reviews { get; private set; } = new List<ProductReview>();

    public Product() { Name = null!; Description = null!; } // EF Core

    public Product(long shopId, string name, string description, string? thumbnailUrl = null, double weight = 0, double length = 0, double width = 0, double height = 0)
    {
        Check(new ProductNameCannotBeEmptyRule(name));

        ShopId = shopId;
        Name = name;
        Description = description;
        Status = ProductStatus.Inactive;
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
        ThumbnailUrl = thumbnailUrl;
        AverageRating = 0;
        ReviewCount = 0;
        RatingSum = 0;
        RebuildSearchDocument();
    }

    public static Product Create(long shopId, string name, string description, string thumbnailUrl, double weight, double length, double width, double height)
    {
        return new Product(shopId, name, description, thumbnailUrl, weight, length, width, height);
    }

    public void UpdateDetails(string name, string description, string? thumbnailUrl = null, string? videoUrl = null, List<string>? imageUrls = null)
    {
        Check(new ProductNameCannotBeEmptyRule(name));
        Name = name;
        Description = description;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        if (videoUrl != null) VideoUrl = videoUrl;
        if (imageUrls != null) ImageUrls = imageUrls;
    }

    public void SetCategory(long? categoryId)
    {
        CategoryId = categoryId;
    }

    public void Activate()
    {
        Status = ProductStatus.Active;
    }

    public void Deactivate()
    {
        Status = ProductStatus.Inactive;
    }

    public void RemoveVariant(long variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant != null)
        {
            variant.SoftDelete();
            RecalculateCachedPrices();
        }
    }


    public void SetMedia(string? thumbnailUrl, string? videoUrl, List<string>? imageUrls)
    {
        ThumbnailUrl = thumbnailUrl;
        VideoUrl = videoUrl;
        if (imageUrls != null)
        {
            ImageUrls = imageUrls;
        }
    }

    public void UpdateInfo(string name, string description, long? categoryId, double weight, double length, double width, double height, string? thumbnailUrl = null, string? videoUrl = null, List<string>? imageUrls = null)
    {
        Check(new ProductNameCannotBeEmptyRule(name));
        Name = name;
        Description = description;
        CategoryId = categoryId;
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        if (videoUrl != null) VideoUrl = videoUrl;
        if (imageUrls != null) ImageUrls = imageUrls;
    }

    public void ClearVariantsAndOptions()
    {
        _options.Clear();
        _variants.Clear();
        RecalculateCachedPrices();
    }

    public void UpdatePricingAndShipping(double weight, double length, double width, double height, decimal price, decimal discountPrice)
    {
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
        Price = price;
        MaxPrice = price;
        DiscountPrice = discountPrice;
    }

    public void UpdateShippingDimensions(double weight, double length, double width, double height)
    {
        Weight = weight;
        Length = length;
        Width = width;
        Height = height;
    }

    public ProductOption AddOption(string optionName, int sortOrder = 0)
    {
        var option = new ProductOption(Id, optionName, sortOrder);
        _options.Add(option);
        return option;
    }

    public ProductVariant AddVariant(decimal price, int availableStock, decimal? discountPrice = null)
    {
        var variant = new ProductVariant(Id, price, availableStock, discountPrice);
        _variants.Add(variant);
        RecalculateCachedPrices();
        return variant;
    }

    public ProductVariant EnsureDefaultVariant(long variantId, decimal price = 0, int availableStock = 0, decimal? discountPrice = null)
    {
        var existing = _variants.FirstOrDefault(v => !v.IsDeleted && !v.VariantOptions.Any());
        if (existing != null)
        {
            existing.UpdateDetails(price, availableStock, discountPrice);
            RecalculateCachedPrices();
            return existing;
        }

        var variant = new ProductVariant(Id, price, availableStock, discountPrice);
        
        variant.UpdateDetails(price, availableStock, discountPrice);
        _variants.Add(variant);
        RecalculateCachedPrices();
        return variant;
    }

    public void Publish()
    {
        if (!_variants.Any(v => !v.IsDeleted))
            throw new InvalidOperationException("Không thể kích hoạt sản phẩm chưa có biến thể (Variant).");

        Status = ProductStatus.Active;
    }

    public void Unpublish()
    {
        Status = ProductStatus.Inactive;
    }

    public void AddReview(int rating)
    {
        if (rating < 1 || rating > 5) return;
        ReviewCount++;
        RatingSum += rating;
        AverageRating = Math.Round((double)RatingSum / ReviewCount, 1);
    }

    public void IncreaseSold(int count)
    {
        if (count > 0)
        {
            Sold += count;
        }
    }

    public void SetAttributes(string? attributesJson)
    {
        AttributesJson = attributesJson;
    }

    public void RecalculateCachedPrices()
    {
        var activeVariants = _variants.Where(v => !v.IsDeleted).ToList();
        if (!activeVariants.Any())
        {
            Price = 0;
            MaxPrice = 0;
            DiscountPrice = 0;
            return;
        }

        Price = activeVariants.Min(v => v.Price);
        MaxPrice = activeVariants.Max(v => v.Price);
        DiscountPrice = activeVariants.Min(v => v.DiscountPrice > 0 ? v.DiscountPrice : v.Price);
    }

    public void RebuildSearchDocument(string? categoryName = null)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(Name))
        {
            parts.Add(Name.Trim());
        }

        var catName = categoryName ?? Category?.Name;
        if (!string.IsNullOrWhiteSpace(catName))
        {
            parts.Add($"Danh mục: {catName.Trim()}");
        }

        // Biến thể / Options
        var activeOptions = _options.Where(o => !o.IsDeleted).ToList();
        foreach (var opt in activeOptions)
        {
            var values = opt.Values
                .Where(v => !v.IsDeleted)
                .Select(v => v.Value.Trim())
                .Where(v => !string.IsNullOrEmpty(v))
                .ToList();

            if (values.Any())
            {
                parts.Add($"{opt.Name.Trim()}: {string.Join(", ", values)}");
            }
        }

        // Thuộc tính từ AttributesJson
        if (!string.IsNullOrWhiteSpace(AttributesJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(AttributesJson);
                if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var elem in doc.RootElement.EnumerateArray())
                    {
                        string? key = null;
                        string? val = null;

                        if (elem.TryGetProperty("key", out var keyProp) || elem.TryGetProperty("name", out keyProp))
                            key = keyProp.GetString();
                        if (elem.TryGetProperty("value", out var valProp))
                            val = valProp.GetString();

                        if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(val))
                        {
                            parts.Add($"{key.Trim()}: {val.Trim()}");
                        }
                    }
                }
                else if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    foreach (var prop in doc.RootElement.EnumerateObject())
                    {
                        var val = prop.Value.GetString();
                        if (!string.IsNullOrWhiteSpace(val))
                        {
                            parts.Add($"{prop.Name.Trim()}: {val.Trim()}");
                        }
                    }
                }
            }
            catch
            {
                // Bỏ qua nếu json không đúng format
            }
        }

        var rawDoc = string.Join(" | ", parts);
        var unaccentedDoc = RemoveDiacritics(rawDoc);
        SearchDocument = $"{rawDoc} || {unaccentedDoc}".ToLowerInvariant();
    }

    private static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder(capacity: normalizedString.Length);

        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                if (c == 'đ' || c == 'Đ')
                    stringBuilder.Append('d');
                else
                    stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
