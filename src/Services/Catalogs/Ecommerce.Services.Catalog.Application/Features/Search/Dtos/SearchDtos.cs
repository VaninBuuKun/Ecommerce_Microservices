using System.Collections.Generic;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Dtos;

public class SearchSuggestionsResponseDto
{
    public string CleanKeyword { get; set; } = string.Empty;
    public ParsedFiltersDto AppliedFilters { get; set; } = new();
    public MatchedCategoryDto? MatchedCategory { get; set; }
    public List<CategorySuggestionDto> SuggestedCategories { get; set; } = new();
    public List<SuggestionItemDto> Suggestions { get; set; } = new();
    public List<ProductSearchPreviewDto> TopProducts { get; set; } = new();
}

public class SearchProductsResponseDto
{
    public string CleanKeyword { get; set; } = string.Empty;
    public ParsedFiltersDto AppliedFilters { get; set; } = new();
    public List<CategorySuggestionDto> SuggestedCategories { get; set; } = new();
    public List<Ecommerce.Services.Catalog.Application.Commons.Dtos.Products.ProductResponse> TopProducts => Products?.Items?.Take(5).ToList() ?? new();
    public BuildingBlocks.Application.Commons.Models.PagedResult<Ecommerce.Services.Catalog.Application.Commons.Dtos.Products.ProductResponse> Products { get; set; } = new();
}

public class CategorySuggestionDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public long? ParentId { get; set; }
    public string? ParentName { get; set; }
}

public class ParsedFiltersDto
{
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? MinRating { get; set; }
    public string? SortBy { get; set; }
}

public class MatchedCategoryDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class SuggestionItemDto
{
    public string Text { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
}

public class ProductSearchPreviewDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public string? ThumbnailUrl { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int Sold { get; set; }
    public long? CategoryId { get; set; }
}
