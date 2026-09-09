using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class SearchSuggestionsSpec : Specification<Product>
{
    public SearchSuggestionsSpec(
        string cleanKeyword, 
        long? categoryId, 
        decimal? minPrice, 
        decimal? maxPrice, 
        int limit)
    {
        Query.Where(p => p.Status == ProductStatus.Active);

        if (!string.IsNullOrWhiteSpace(cleanKeyword))
        {
            var tokens = cleanKeyword.Trim()
                .Split(new[] { ' ', ',', '-', '+' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var token in tokens)
            {
                var lowerToken = token.ToLower();
                Query.Where(p => p.SearchDocument.Contains(lowerToken));
            }
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            Query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (minPrice.HasValue && minPrice.Value > 0)
        {
            Query.Where(p => p.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue && maxPrice.Value > 0)
        {
            Query.Where(p => p.Price <= maxPrice.Value);
        }

        Query.OrderByDescending(p => p.Sold)
             .ThenByDescending(p => p.AverageRating)
             .Take(limit);
    }
}
