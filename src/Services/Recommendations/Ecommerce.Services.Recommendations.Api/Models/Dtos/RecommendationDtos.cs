using System.Collections.Generic;

namespace Ecommerce.Services.Recommendations.Api.Models.Dtos;

public class RecommendedProductDto
{
    public long Id { get; set; }
    public long ShopId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public string? ThumbnailUrl { get; set; }
    public int Sold { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public long? CategoryId { get; set; }
    public double MatchScore { get; set; }
    public string? RecommendationReason { get; set; }
}

public class RecommendationResponse
{
    public string Strategy { get; set; } = string.Empty;
    public List<RecommendedProductDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool HasNext { get; set; }
}
