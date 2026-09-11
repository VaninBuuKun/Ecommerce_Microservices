using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Recommendations.Api.Models.Dtos;

public class TrackProductViewRequest
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long ProductId { get; set; }
    public int? DurationSeconds { get; set; }
}

public class ProductViewStatsDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long ProductId { get; set; }
    public long TotalViews { get; set; }
    public long ViewsLast24h { get; set; }
    public long ViewsLast7Days { get; set; }
}
