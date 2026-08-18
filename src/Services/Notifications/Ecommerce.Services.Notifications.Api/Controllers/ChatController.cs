using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Services;
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
}
