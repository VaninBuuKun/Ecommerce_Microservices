using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductsFilterSpec : Specification<Product>
{
    public ProductsFilterSpec(
        string? searchTerm,
        long? categoryId,
        double? minRating,
        long? shopId = null,
        bool? hasDiscount = null,
        decimal? minPrice = null,
        decimal? maxPrice = null)
    {
        // 1. Chỉ lấy sản phẩm đang hoạt động
        Query.Where(p => p.Status == ProductStatus.Active);

        // 2. Filter theo SearchTerm qua GIN Trigram SearchDocument
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var tokens = searchTerm.Trim()
                .Split(new[] { ' ', ',', '-', '+' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var token in tokens)
            {
                var lowerToken = token.ToLower();
                Query.Where(p => p.SearchDocument.Contains(lowerToken));
            }
        }

        // 3. Filter theo Category
        if (categoryId.HasValue)
        {
            Query.Where(p => p.CategoryId == categoryId.Value);
        }

        // 4. Filter theo MinRating
        if (minRating.HasValue)
        {
            Query.Where(p => p.AverageRating >= minRating.Value);
        }

        // 5. Filter theo ShopId
        if (shopId.HasValue)
        {
            Query.Where(p => p.ShopId == shopId.Value);
        }

        // 6. Filter theo HasDiscount
        if (hasDiscount.HasValue && hasDiscount.Value)
        {
            Query.Where(p => p.DiscountPrice > 0 && p.DiscountPrice < p.Price);
        }

        // 7. Filter theo MinPrice & MaxPrice
        if (minPrice.HasValue && minPrice.Value > 0)
        {
            Query.Where(p => p.Price >= minPrice.Value);
        }
        if (maxPrice.HasValue && maxPrice.Value > 0)
        {
            Query.Where(p => p.Price <= maxPrice.Value);
        }
    }
}
