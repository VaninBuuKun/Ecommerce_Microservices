using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Analytics.Api.Controllers;

[ApiController]
[Route("api/analytics/admin")]
public class AdminAnalyticsController(IAdminAnalyticsService adminAnalyticsService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken = default)
    {
        var result = await adminAnalyticsService.GetOverviewAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("revenue-chart")]
    public async Task<IActionResult> GetRevenueChart([FromQuery] string period = "7d", [FromQuery] int? year = null, [FromQuery] int? month = null, CancellationToken cancellationToken = default)
    {
        var result = await adminAnalyticsService.GetRevenueChartAsync(period, year, month, cancellationToken);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        var result = await adminAnalyticsService.GetTopProductsAsync(limit, cancellationToken);
        return Ok(result);
    }
}
