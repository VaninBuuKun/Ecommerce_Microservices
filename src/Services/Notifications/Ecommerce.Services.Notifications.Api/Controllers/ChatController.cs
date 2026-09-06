using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Auth;

namespace Ecommerce.Services.Notifications.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController(IChatService chatService, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách các cuộc hội thoại (ChatRooms) của User hiện tại (Buyer hoặc Seller Shop).
    /// </summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(List<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(
        [FromQuery] bool isSeller,
        [FromServices] BuildingBlocks.Grpc.Services.IdentityGrpc.IdentityGrpcClient identityClient,
        [FromServices] BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient sellerClient)
    {
        var currentUserId = currentUserService.UserId;
        var result = await chatService.GetConversationsAsync(currentUserId, isSeller, identityClient, sellerClient);
        
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
    /// <summary>
    /// Cập nhật chủ đề màu sắc cho phòng chat.
    /// </summary>
    [HttpPut("rooms/{roomId}/theme")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRoomTheme(
        [FromRoute] Guid roomId,
        [FromBody] UpdateRoomThemeRequest request)
    {
        var currentUserId = currentUserService.UserId;
        var result = await chatService.UpdateRoomThemeAsync(roomId, currentUserId, request.ThemeColor, request.BackgroundColor);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    /// <summary>
    /// Lấy lịch sử tin nhắn của một phòng chat (hỗ trợ phân trang scrolling).
    /// </summary>
    [HttpGet("rooms/{roomId}/messages")]
    [ProducesResponseType(typeof(List<ChatMessageItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessages(
        [FromRoute] Guid roomId,
        [FromQuery] Guid? beforeMessageId = null,
        [FromQuery] int limit = 50)
    {
        var currentUserId = currentUserService.UserId;
        var result = await chatService.GetMessagesAsync(roomId, currentUserId, beforeMessageId, limit);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public class ChatMessageItemDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public long SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text";
    public DateTimeOffset SentAt { get; set; }
}

public class ConversationDto
{
    public Guid RoomId { get; set; }
    public long ShopId { get; set; }
    public long BuyerUserId { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTimeOffset LastActiveAt { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string DisplayAvatar { get; set; } = string.Empty;
    public string? ThemeColor { get; set; }
    public string? BackgroundColor { get; set; }
}

public class UpdateRoomThemeRequest
{
    public string? ThemeColor { get; set; }
    public string? BackgroundColor { get; set; }
}
