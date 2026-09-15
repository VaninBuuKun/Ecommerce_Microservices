using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Analytics.Api.Controllers;

[ApiController]
[Route("api/analytics/shops/{shopId:long}")]
public class SellerAnalyticsController(ISellerAnalyticsService sellerAnalyticsService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(long shopId, CancellationToken cancellationToken = default)
    {
        var result = await sellerAnalyticsService.GetOverviewAsync(shopId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("revenue-chart")]
    public async Task<IActionResult> GetRevenueChart(long shopId, [FromQuery] string period = "7d", [FromQuery] int? year = null, [FromQuery] int? month = null, CancellationToken cancellationToken = default)
    {
        var result = await sellerAnalyticsService.GetRevenueChartAsync(shopId, period, year, month, cancellationToken);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts(long shopId, [FromQuery] int limit = 30, CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 30); // Tối đa 30 sản phẩm bán chạy nhất của shop
        var result = await sellerAnalyticsService.GetTopProductsAsync(shopId, safeLimit, cancellationToken);
        return Ok(result);
    }
}
