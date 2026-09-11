namespace Ecommerce.Services.Recommendations.Api.Models.Dtos;

public class TrackProductViewRequest
{
    public long ProductId { get; set; }
    public int? DurationSeconds { get; set; }
}

public class ProductViewStatsDto
{
    public long ProductId { get; set; }
    public long TotalViews { get; set; }
    public long ViewsLast24h { get; set; }
    public long ViewsLast7Days { get; set; }
}
