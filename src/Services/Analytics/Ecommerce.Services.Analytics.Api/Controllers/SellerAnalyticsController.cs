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
    public async Task<IActionResult> GetRevenueChart(long shopId, [FromQuery] string period = "7d", CancellationToken cancellationToken = default)
    {
        var result = await sellerAnalyticsService.GetRevenueChartAsync(shopId, period, cancellationToken);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts(long shopId, [FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        var result = await sellerAnalyticsService.GetTopProductsAsync(shopId, limit, cancellationToken);
        return Ok(result);
    }
}
