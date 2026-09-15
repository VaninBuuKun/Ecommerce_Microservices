using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Dtos;

namespace Ecommerce.Services.Analytics.Api.Models.Interfaces;

public interface IAdminAnalyticsService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<List<AdminRevenueChartDto>> GetRevenueChartAsync(string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default);
    Task<PaginatedProductsDto> GetTopProductsAsync(int page = 1, int pageSize = 15, long? parentCategoryId = null, CancellationToken cancellationToken = default);
    Task<List<AdminCategoryDto>> GetCategoriesAsync(string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default);
    Task<ProductDetailAnalyticsDto?> GetProductDetailAnalyticsAsync(long productId, string period = "7d", CancellationToken cancellationToken = default);
    Task<PaginatedProductsDto> GetShopProductsAsync(long shopId, int page = 1, int pageSize = 15, CancellationToken cancellationToken = default);
}
