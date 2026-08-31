using System.Threading.Tasks;
using Ecommerce.Services.Catalog.Application.Features.Banners.Commands.CreateBanner;
using Ecommerce.Services.Catalog.Application.Features.Banners.Commands.DeleteBanner;
using Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ReorderBanners;
using Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ToggleBannerStatus;
using Ecommerce.Services.Catalog.Application.Features.Banners.Commands.UpdateBanner;
using Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;
using Ecommerce.Services.Catalog.Application.Features.Banners.Queries.GetActiveBanners;
using Ecommerce.Services.Catalog.Application.Features.Banners.Queries.GetBannersForAdmin;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách banner đang kích hoạt cho khách hàng & trang chủ (Public).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveBanners()
    {
        var result = await sender.Send(new GetActiveBannersQuery());
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách banner (Bao gồm cả active và inactive) dành riêng cho Admin.
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetBannersForAdmin()
    {
        var result = await sender.Send(new GetBannersForAdminQuery());
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Admin tạo banner mới (Mặc định IsActive = false, DisplayOrder = 0).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateBanner([FromBody] CreateBannerRequest request)
    {
        var result = await sender.Send(new CreateBannerCommand(request));
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Admin cập nhật thông tin banner.
    /// </summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateBanner(long id, [FromBody] UpdateBannerRequest request)
    {
        var result = await sender.Send(new UpdateBannerCommand(id, request));
        if (result.IsSuccess)
        {
            return Ok();
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Admin xóa banner.
    /// </summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBanner(long id)
    {
        var result = await sender.Send(new DeleteBannerCommand(id));
        if (result.IsSuccess)
        {
            return Ok();
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Admin bật/tắt hiển thị banner kèm vị trí sắp xếp tùy chọn.
    /// </summary>
    [HttpPatch("{id:long}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleBannerStatus(long id, [FromBody] ToggleBannerStatusRequest? request = null)
    {
        var result = await sender.Send(new ToggleBannerStatusCommand(id, request?.CustomDisplayOrder));
        if (result.IsSuccess)
        {
            return Ok();
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Admin kéo thả sắp xếp lại toàn bộ thứ tự banner (Reorder sorted list).
    /// </summary>
    [HttpPut("reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReorderBanners([FromBody] ReorderBannersRequest request)
    {
        var result = await sender.Send(new ReorderBannersCommand(request.BannerIds));
        if (result.IsSuccess)
        {
            return Ok();
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
