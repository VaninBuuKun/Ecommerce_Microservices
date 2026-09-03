using BuildingBlocks.Auth;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.CreateVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.DeleteVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.UpdateVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAdminVouchers;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAvailableVouchers;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetShopVouchers;
using Ecommerce.Services.Orders.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Orders.Api.Controllers;

[ApiController]
[Route("api/[controller]s")]
public class VoucherController(ISender sender, ICurrentUserService userService) : ControllerBase
{
    /// <summary>Tạo voucher mới (Admin: platform-scope; Seller: shop-scope)</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherRequest request)
    {
        var result = await sender.Send(new CreateVoucherCommand(userService.IsAdmin, userService.UserId, request));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Cập nhật voucher — bao gồm active/deactive qua IsActive field</summary>
    [HttpPut("{voucherId:long}")]
    public async Task<IActionResult> Update(long voucherId, [FromBody] UpdateVoucherRequest request)
    {
        var result = await sender.Send(new UpdateVoucherCommand(userService.IsAdmin, userService.UserId, voucherId, request));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Xóa hoặc ngừng kích hoạt voucher</summary>
    [HttpDelete("{voucherId:long}")]
    public async Task<IActionResult> Delete(long voucherId)
    {
        var result = await sender.Send(new DeleteVoucherCommand(userService.IsAdmin, userService.UserId, voucherId));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Lấy danh sách voucher cho Admin (Hỗ trợ lọc scope: Platform / Shop, ShopId, DiscountType, IsActive,...)</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminVouchers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? code = null,
        [FromQuery] DiscountType? discountType = null,
        [FromQuery] VoucherScope? scope = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] long? shopId = null,
        [FromQuery] bool? usageLimit = null,
        [FromQuery] DateTimeOffset? startDate = null,
        [FromQuery] DateTimeOffset? endDate = null)
    {
        var result = await sender.Send(new GetAdminVouchersQuery(page, pageSize, code, discountType, scope, isActive, shopId, usageLimit, startDate, endDate));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Lấy danh sách voucher cho Shop (Chỉ lấy voucher thuộc phạm vi shopId)</summary>
    [HttpGet("shop/{shopId:long}")]
    public async Task<IActionResult> GetShopVouchers(
        long shopId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? code = null,
        [FromQuery] DiscountType? discountType = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await sender.Send(new GetShopVouchersQuery(shopId, page, pageSize, code, discountType, isActive));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Lấy danh sách voucher chung (Hỗ trợ phân trang và fallback query)</summary>
    [HttpGet]
    public async Task<IActionResult> GetVouchers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? code = null,
        [FromQuery] DiscountType? discountType = null,
        [FromQuery] bool? usageLimit = null,
        [FromQuery] DateTimeOffset? startDate = null,
        [FromQuery] DateTimeOffset? endDate = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] long? shopId = null)
    {
        if (shopId.HasValue && shopId.Value > 0)
        {
            var shopResult = await sender.Send(new GetShopVouchersQuery(shopId.Value, page, pageSize, code, discountType, isActive));
            return shopResult.IsSuccess
                ? Ok(shopResult.Value)
                : StatusCode(shopResult.GetHttpStatusCode(), shopResult.Message);
        }

        var result = await sender.Send(new GetAdminVouchersQuery(page, pageSize, code, discountType, null, isActive, null, usageLimit, startDate, endDate));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>Lấy danh sách voucher khả dụng cho checkout của người dùng hiện tại</summary>
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableVouchers([FromQuery] long? shopId = null)
    {
        var customerId = userService.UserId;
        var result = await sender.Send(new GetAvailableVouchersQuery(customerId, shopId));

        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}