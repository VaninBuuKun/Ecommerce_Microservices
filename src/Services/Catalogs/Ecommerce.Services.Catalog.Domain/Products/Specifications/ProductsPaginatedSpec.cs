using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductsPaginatedSpec : ProductsFilterSpec
{
    public ProductsPaginatedSpec(
        string? searchTerm,
        long? categoryId,
        double? minRating,
        int page,
        int pageSize,
        string sortBy = "name",
        long? shopId = null,
        bool? hasDiscount = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        IReadOnlyList<long>? categoryIds = null)
        : base(searchTerm, categoryId, minRating, shopId, hasDiscount, minPrice, maxPrice, categoryIds)
    {
        // 1. Include Category
        Query.Include(p => p.Category);

        // 2. Sorting
        switch (sortBy?.ToLower())
        {
            case "discount":
                Query.OrderByDescending(p => (p.Price - p.DiscountPrice)).ThenBy(p => p.Id);
                break;
            case "price_asc":
                Query.OrderBy(p => p.Price).ThenBy(p => p.Id);
                break;
            case "price_desc":
                Query.OrderByDescending(p => p.Price).ThenBy(p => p.Id);
                break;
            case "newest":
                Query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id);
                break;
            case "oldest":
                Query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id);
                break;
            case "relevance":
                Query.OrderByDescending(p => p.Sold).ThenByDescending(p => p.AverageRating).ThenBy(p => p.Id);
                break;
            case "sold":
            case "best_selling":
                Query.OrderByDescending(p => p.Sold).ThenBy(p => p.Id);
                break;
            case "rating":
                Query.OrderByDescending(p => p.AverageRating).ThenBy(p => p.Id);
                break;
            case "reviews":
                Query.OrderByDescending(p => p.ReviewCount).ThenBy(p => p.Id);
                break;
            case "name":
                Query.OrderBy(p => p.Name).ThenBy(p => p.Id);
                break;
            default:
                Query.OrderByDescending(p => p.Sold).ThenByDescending(p => p.AverageRating).ThenBy(p => p.Id);
                break;
        }

        // 3. Offset Paging
        var skip = Math.Max(0, (page - 1) * pageSize);
        Query.Skip(skip).Take(pageSize);
    }
}
