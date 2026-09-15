using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Recommendations.Api.Models.Dtos;

namespace Ecommerce.Services.Recommendations.Api.Models.Interfaces;

public interface IRecommendationService
{
    Task<RecommendationResponse> GetSimilarProductsAsync(long productId, int limit, CancellationToken cancellationToken = default);
    Task<RecommendationResponse> GetPersonalizedRecommendationsAsync(long? userId, string? sessionId, int page = 1, CancellationToken cancellationToken = default);
    Task<RecommendationResponse> GetTrendingProductsAsync(int page = 1, CancellationToken cancellationToken = default);
}
