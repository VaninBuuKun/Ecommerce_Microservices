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
    public async Task<IActionResult> GetTopProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] int? limit = null,
        [FromQuery] long? parentCategoryId = null,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var rawSize = limit.HasValue && limit.Value > 0 ? limit.Value : pageSize;
        // Giới hạn an toàn: chuẩn hóa pageSize từ 1 đến tối đa 30 sản phẩm (2 trang x 15)
        var safePageSize = Math.Clamp(rawSize, 1, 30);
        var result = await adminAnalyticsService.GetTopProductsAsync(safePage, safePageSize, parentCategoryId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(
        [FromQuery] string period = "7d",
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        CancellationToken cancellationToken = default)
    {
        var result = await adminAnalyticsService.GetCategoriesAsync(period, year, month, cancellationToken);
        return Ok(result);
    }

    [HttpGet("products/{productId:long}")]
    public async Task<IActionResult> GetProductAnalytics(
        long productId,
        [FromQuery] string period = "7d",
        CancellationToken cancellationToken = default)
    {
        var result = await adminAnalyticsService.GetProductDetailAnalyticsAsync(productId, period, cancellationToken);
        if (result == null)
        {
            return NotFound("Không tìm thấy dữ liệu thống kê cho sản phẩm này.");
        }
        return Ok(result);
    }

    [HttpGet("shops/{shopId:long}/products")]
    public async Task<IActionResult> GetShopProducts(
        long shopId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 50); // Giới hạn an toàn tối đa 50 sản phẩm/trang
        var result = await adminAnalyticsService.GetShopProductsAsync(shopId, safePage, safePageSize, cancellationToken);
        return Ok(result);
    }
}
