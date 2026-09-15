using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Ecommerce.Services.Recommendations.Api.Models.Dtos;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Recommendations.Api.Controllers;

[ApiController]
[Route("api/product-views")]
public class ProductViewsController(
    IProductViewService productViewService,
    ICurrentUserService currentUserService)
    : ControllerBase
{
    /// <summary>
    /// Ghi nhận lượt xem sản phẩm (hỗ trợ throttle 30 phút qua Redis).
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> TrackView(
        [FromBody] TrackProductViewRequest request, 
        CancellationToken cancellationToken = default)
    {
        long? userId = currentUserService.IsAuthenticated && currentUserService.UserId > 0 
            ? currentUserService.UserId 
            : null;

        string? sessionId = Request.Headers.TryGetValue("X-Session-Id", out var sid) ? sid.ToString() : null;

        var tracked = await productViewService.TrackViewAsync(userId, sessionId, request, cancellationToken);
        return Ok(new { tracked });
    }

    /// <summary>
    /// Thống kê lượt xem sản phẩm (tổng số, 24h qua, 7 ngày qua).
    /// </summary>
    [HttpGet("{productId:long}/stats")]
    public async Task<IActionResult> GetViewStats(
        long productId, 
        CancellationToken cancellationToken = default)
    {
        var stats = await productViewService.GetProductViewStatsAsync(productId, cancellationToken);
        return Ok(stats);
    }
}
