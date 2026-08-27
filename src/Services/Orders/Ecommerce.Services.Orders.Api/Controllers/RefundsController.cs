using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Web.Controllers;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.ApproveRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.RejectRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelRefund;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.EscalateToDispute;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.SendDisputeMessage;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.ResolveDispute;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetMyRefunds;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetShopRefunds;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetDisputeThread;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        var command = new CreateRefundCommand(input.SubOrderId, UserId, input.Reason, input.Medias);
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
    [HttpPut("{id:long}/approve")]
    public async Task<IActionResult> ApproveRefund(long id, [FromBody] ApproveRefundInput input, CancellationToken cancellationToken)
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
    [HttpPut("{id:long}/reject")]
    public async Task<IActionResult> RejectRefund(long id, [FromBody] RejectRefundInput input, CancellationToken cancellationToken)
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
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> CancelRefund(long id, CancellationToken cancellationToken)
    {
        var command = new CancelRefundCommand(id, UserId);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Khách hàng bấm khiếu nại lên Admin (Escalate to Dispute Room 48h)
    /// </summary>
    [HttpPost("{id:long}/escalate")]
    public async Task<IActionResult> EscalateToDispute(long id, [FromBody] EscalateInput input, CancellationToken cancellationToken)
    {
        var command = new EscalateToDisputeCommand(id, UserId, input.ReasonNote);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Lấy thông tin Phòng Tranh Chấp 3 Bên (Dispute Room)
    /// </summary>
    [HttpGet("{id:long}/dispute-thread")]
    [ProducesResponseType(typeof(DisputeThreadDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDisputeThread(long id, CancellationToken cancellationToken)
    {
        var query = new GetDisputeThreadQuery(id, UserId);
        var result = await _sender.SendAsync(query, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Khách / Shop / Admin gửi tin nhắn và bằng chứng vào Phòng Tranh Chấp
    /// </summary>
    [HttpPost("dispute-threads/{threadId:long}/messages")]
    public async Task<IActionResult> SendDisputeMessage(long threadId, [FromBody] SendDisputeMessageInput input, CancellationToken cancellationToken)
    {
        var command = new SendDisputeMessageCommand(threadId, UserId, input.SenderRole, input.Content, input.AttachmentUrls);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Admin đưa ra phán quyết cuối cùng cho Phòng Tranh Chấp
    /// </summary>
    [HttpPost("dispute-threads/{threadId:long}/resolve")]
    public async Task<IActionResult> ResolveDispute(long threadId, [FromBody] ResolveDisputeInput input, CancellationToken cancellationToken)
    {
        var command = new ResolveDisputeCommand(threadId, UserId, input.ApproveRefund, input.AdminNote);
        var result = await _sender.SendAsync(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result)
            : StatusCode(result.GetHttpStatusCode(), result);
    }
}

public record CreateRefundInput(long SubOrderId, string Reason, List<string>? Medias = null);
public record ApproveRefundInput(string? SellerNote);
public record RejectRefundInput(string SellerNote);
public record EscalateInput(string? ReasonNote = null);
public record SendDisputeMessageInput(string SenderRole, string Content, List<string>? AttachmentUrls = null);
public record ResolveDisputeInput(bool ApproveRefund, string? AdminNote = null);
