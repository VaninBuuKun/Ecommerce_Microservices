using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Dtos;

namespace Ecommerce.Services.Analytics.Api.Models.Interfaces;

public interface ISellerAnalyticsService
{
    Task<SellerOverviewDto> GetOverviewAsync(long shopId, CancellationToken cancellationToken = default);
    Task<List<RevenueChartPointDto>> GetRevenueChartAsync(long shopId, string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default);
    Task<List<TopProductDto>> GetTopProductsAsync(long shopId, int limit = 30, CancellationToken cancellationToken = default);
}
