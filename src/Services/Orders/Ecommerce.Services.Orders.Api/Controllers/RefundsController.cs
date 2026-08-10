using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Web.Controllers;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.ApproveRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.RejectRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetMyRefunds;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetShopRefunds;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelRefund;

namespace Ecommerce.Services.Orders.Api.Controllers;

[Tags("Refunds")]
public class RefundsController(ICurrentUserService currentUserService) : CleanV1CustomController
{
    private long UserId => currentUserService.UserId;

    /// <summary>
    /// Khách hàng tạo yêu cầu hoàn tiền / trả hàng
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RefundRequestDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateRefund([FromBody] CreateRefundInput input, CancellationToken cancellationToken)
    {
        var command = new CreateRefundCommand(input.SubOrderId, UserId, input.Reason);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Khách hàng xem lịch sử các yêu cầu hoàn tiền của mình
    /// </summary>
    [HttpGet("my-requests")]
    [ProducesResponseType(typeof(List<RefundRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRefunds(CancellationToken cancellationToken)
    {
        var query = new GetMyRefundsQuery(UserId);
        var result = await _sender.SendAsync(query, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán (Seller) xem danh sách yêu cầu hoàn tiền gửi tới cửa hàng của mình
    /// </summary>
    [HttpGet("shop-requests/{shopId:long}")]
    [ProducesResponseType(typeof(List<RefundRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShopRefunds(long shopId, CancellationToken cancellationToken)
    {
        var query = new GetShopRefundsQuery(shopId, UserId);
        var result = await _sender.SendAsync(query, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán duyệt chấp nhận yêu cầu hoàn tiền
    /// </summary>
    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> ApproveRefund(Guid id, [FromBody] ApproveRefundInput input, CancellationToken cancellationToken)
    {
        var command = new ApproveRefundCommand(id, UserId, input.SellerNote);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán từ chối yêu cầu hoàn tiền
    /// </summary>
    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> RejectRefund(Guid id, [FromBody] RejectRefundInput input, CancellationToken cancellationToken)
    {
        var command = new RejectRefundCommand(id, UserId, input.SellerNote);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Khách hàng hủy/rút yêu cầu hoàn tiền
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelRefund(Guid id, CancellationToken cancellationToken)
    {
        var command = new CancelRefundCommand(id, UserId);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }
}

public record CreateRefundInput(Guid SubOrderId, string Reason);
public record ApproveRefundInput(string? SellerNote);
public record RejectRefundInput(string SellerNote);
