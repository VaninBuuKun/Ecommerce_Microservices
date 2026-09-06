using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Notifications.Api.Controllers;

namespace Ecommerce.Services.Notifications.Api.Models.Interfaces;

public interface IChatService
{
    Task<Result<List<ConversationDto>>> GetConversationsAsync(
        long currentUserId, 
        bool isSeller, 
        BuildingBlocks.Grpc.Services.IdentityGrpc.IdentityGrpcClient identityClient,
        BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient sellerClient);

    Task<Result<bool>> UpdateRoomThemeAsync(Guid roomId, long currentUserId, string? themeColor, string? backgroundColor);

    Task<Result<List<ChatMessageItemDto>>> GetMessagesAsync(Guid roomId, long currentUserId, Guid? beforeMessageId = null, int limit = 50);
}
