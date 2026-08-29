using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class ProductsWithCursorPaginationSpec : Specification<Product>
{
    public ProductsWithCursorPaginationSpec(
        string? searchTerm, 
        long? categoryId, 
        double? minRating, 
        string sortBy, 
        string? lastValue, 
        long? lastId, 
        int limit,
        long? shopId = null)
    {
        // 1. Chỉ lấy sản phẩm đang hoạt động
        Query.Where(p => p.Status == ProductStatus.Active);

        // 2. Filter theo SearchTerm (Native Full-Text Search Case-Insensitive)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            Query.Where(p => 
                p.Name.ToLower().Contains(term) || 
                (p.Description != null && p.Description.ToLower().Contains(term))
            );
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

        // 4b. Filter theo ShopId
        if (shopId.HasValue)
        {
            Query.Where(p => p.ShopId == shopId.Value);
        }

        // 5. Load Navigation Properties
        Query.Include(p => p.Category);

        // 6. Áp dụng sắp xếp và Keyset Pagination
        switch (sortBy?.ToLower())
        {
            case "price_asc":
                if (lastValue != null && lastId != null && decimal.TryParse(lastValue, out var priceAscLimit))
                {
                    Query.Where(p => p.Price > priceAscLimit || 
                        (p.Price == priceAscLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderBy(p => p.Price).ThenBy(p => p.Id);
                break;

            case "price_desc":
                if (lastValue != null && lastId != null && decimal.TryParse(lastValue, out var priceDescLimit))
                {
                    Query.Where(p => p.Price < priceDescLimit || 
                        (p.Price == priceDescLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.Price).ThenBy(p => p.Id);
                break;

            case "newest":
                if (lastValue != null && lastId != null && long.TryParse(lastValue, out var newestTicks))
                {
                    var dt = new DateTime(newestTicks, DateTimeKind.Utc);
                    Query.Where(p => p.CreatedAt < dt || 
                        (p.CreatedAt == dt && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id);
                break;

            case "oldest":
                if (lastValue != null && lastId != null && long.TryParse(lastValue, out var oldestTicks))
                {
                    var dt = new DateTime(oldestTicks, DateTimeKind.Utc);
                    Query.Where(p => p.CreatedAt > dt || 
                        (p.CreatedAt == dt && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id);
                break;

            case "sold":
            case "best_selling":
                if (lastValue != null && lastId != null && int.TryParse(lastValue, out var soldLimit))
                {
                    Query.Where(p => p.Sold < soldLimit || 
                        (p.Sold == soldLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.Sold).ThenBy(p => p.Id);
                break;

            case "rating":
                if (lastValue != null && lastId != null && double.TryParse(lastValue, out var ratingLimit))
                {
                    Query.Where(p => p.AverageRating < ratingLimit || 
                        (p.AverageRating == ratingLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.AverageRating).ThenBy(p => p.Id);
                break;

            case "reviews":
                if (lastValue != null && lastId != null && int.TryParse(lastValue, out var reviewLimit))
                {
                    Query.Where(p => p.ReviewCount < reviewLimit || 
                        (p.ReviewCount == reviewLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.ReviewCount).ThenBy(p => p.Id);
                break;

            case "name":
            default:
                if (lastValue != null && lastId != null)
                {
                    Query.Where(p => string.Compare(p.Name, lastValue) > 0 || 
                        (p.Name == lastValue && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderBy(p => p.Name).ThenBy(p => p.Id);
                break;
        }

        // Lấy thêm 1 bản ghi để check HasNext
        Query.Take(limit);
    }
}
