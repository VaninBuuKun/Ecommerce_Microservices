using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Recommendations.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController(
    IRecommendationService recommendationService,
    IDataSyncService dataSyncService,
    ICurrentUserService currentUserService)
    : ControllerBase
{
    /// <summary>
    /// Đồng bộ dữ liệu danh mục & sản phẩm từ CatalogDb sang RecommendationDb on-demand.
    /// </summary>
    [HttpPost("sync")]
    public async Task<IActionResult> SyncCatalogData(CancellationToken cancellationToken = default)
    {
        var (categoriesSynced, productsSynced) = await dataSyncService.SyncFromCatalogAsync(cancellationToken);
        return Ok(new
        {
            success = true,
            categoriesSynced,
            productsSynced,
            message = $"Đồng bộ thành công {categoriesSynced} danh mục và {productsSynced} sản phẩm sang RecommendationDb."
        });
    }
    /// <summary>
    /// Gợi ý sản phẩm tương tự (Content-based) dựa trên danh mục, mức giá, thuộc tính.
    /// Dùng cho trang ProductDetailPage.
    /// </summary>
    [HttpGet("similar/{productId:long}")]
    public async Task<IActionResult> GetSimilarProducts(
        long productId, 
        [FromQuery] int limit = 12, 
        CancellationToken cancellationToken = default)
    {
        var result = await recommendationService.GetSimilarProductsAsync(productId, limit, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gợi ý cá nhân hóa cho người dùng dựa trên lịch sử mua, xem, yêu thích.
    /// Cố định pageSize = 18. Page 1 luôn sinh pool mới (tối đa 108 items) và lưu Redis.
    /// Page 2..6 lấy trực tiếp từ Redis pool. Tối đa 5 lần bấm Xem thêm.
    /// </summary>
    [HttpGet("for-you")]
    public async Task<IActionResult> GetPersonalizedFeed(
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default)
    {
        long? userId = currentUserService.IsAuthenticated && currentUserService.UserId > 0 
            ? currentUserService.UserId 
            : null;

        string? sessionId = Request.Headers.TryGetValue("X-Session-Id", out var sid) ? sid.ToString() : null;

        var result = await recommendationService.GetPersonalizedRecommendationsAsync(userId, sessionId, page, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gợi ý sản phẩm hot trend dựa trên tổng hợp view 24h, mua hàng 7 ngày và wishlist.
    /// Cố định pageSize = 18. Page 1 luôn sinh pool mới (tối đa 108 items) và lưu Redis.
    /// Page 2..6 lấy trực tiếp từ Redis pool. Tối đa 5 lần bấm Xem thêm.
    /// </summary>
    [HttpGet("trending")]
    public async Task<IActionResult> GetTrendingProducts(
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default)
    {
        var result = await recommendationService.GetTrendingProductsAsync(page, cancellationToken);
        return Ok(result);
    }
}
