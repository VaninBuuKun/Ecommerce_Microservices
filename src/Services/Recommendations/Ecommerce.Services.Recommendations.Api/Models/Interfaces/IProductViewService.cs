using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Recommendations.Api.Models.Dtos;

namespace Ecommerce.Services.Recommendations.Api.Models.Interfaces;

public interface IProductViewService
{
    Task<bool> TrackViewAsync(long? userId, string? sessionId, TrackProductViewRequest request, CancellationToken cancellationToken = default);
    Task<ProductViewStatsDto> GetProductViewStatsAsync(long productId, CancellationToken cancellationToken = default);
}
