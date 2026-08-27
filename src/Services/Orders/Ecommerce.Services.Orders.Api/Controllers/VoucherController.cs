using BuildingBlocks.Auth;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.CreateVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.UpdateVoucher;
using Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;
using Ecommerce.Services.Orders.Domain.Enums;
using MediatR;
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

    /// <summary>Lấy danh sách voucher có pagination (Admin/Seller quản lý)</summary>
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
        var result = await sender.Send(new GetVouchersQuery(page, pageSize, code, discountType, usageLimit, startDate, endDate, isActive, shopId));

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