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
        Guid? lastId, 
        int limit,
        long? shopId = null)
    {
        // 1. Chỉ lấy sản phẩm đang hoạt động
        Query.Where(p => p.Status == ProductStatus.Active);

        // 2. Filter theo SearchTerm
        if (!string.IsNullOrEmpty(searchTerm))
        {
            Query.Where(p => p.Name.Contains(searchTerm));
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
        switch (sortBy.ToLower())
        {
            case "rating":
                if (lastValue != null && lastId != null)
                {
                    var ratingLimit = double.Parse(lastValue);
                    Query.Where(p => p.AverageRating < ratingLimit || 
                        (p.AverageRating == ratingLimit && p.Id.CompareTo(lastId.Value) > 0));
                }
                Query.OrderByDescending(p => p.AverageRating).ThenBy(p => p.Id);
                break;

            case "reviews":
                if (lastValue != null && lastId != null)
                {
                    var reviewLimit = int.Parse(lastValue);
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
