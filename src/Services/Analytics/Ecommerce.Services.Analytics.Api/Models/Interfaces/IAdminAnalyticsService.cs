using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Dtos;

namespace Ecommerce.Services.Analytics.Api.Models.Interfaces;

public interface IAdminAnalyticsService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<List<AdminRevenueChartDto>> GetRevenueChartAsync(string period = "7d", CancellationToken cancellationToken = default);
}
