using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Notifications.Api.Controllers;
using Ecommerce.Services.Notifications.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Notifications.Api.Services;

public class ChatService(NotificationDbContext dbContext) : IChatService
{
    public async Task<Result<List<ConversationDto>>> GetConversationsAsync(
        long currentUserId, 
        bool isSeller, 
        BuildingBlocks.Grpc.Services.IdentityGrpc.IdentityGrpcClient identityClient,
        BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient sellerClient)
    {
        var result = new List<ConversationDto>();

        if (isSeller)
        {
            // 1. Dành cho Người bán (Seller): Lấy các phòng chat của Shop thuộc quyền sở hữu/quản lý
            var rooms = await dbContext.ChatRooms
                .OrderByDescending(r => r.LastActiveAt)
                .ToListAsync();

            if (!rooms.Any()) return Result<List<ConversationDto>>.Success(result);

            var buyerUserIds = rooms.Select(r => r.BuyerUserId).Distinct().ToList();
            var userDetailDict = new Dictionary<long, BuildingBlocks.Grpc.Services.GetUserResponse>();

            foreach (var buyerId in buyerUserIds)
            {
                try
                {
                    var userRes = await identityClient.GetUserAsync(new BuildingBlocks.Grpc.Services.GetUserRequest
                        { UserId = buyerId });
                    if (userRes != null && userRes.Found)
                    {
                        userDetailDict[buyerId] = userRes;
                    }
                }
                catch
                {
                }
            }

            foreach (var room in rooms)
            {
                userDetailDict.TryGetValue(room.BuyerUserId, out var buyerInfo);
                result.Add(new ConversationDto
                {
                    RoomId = room.Id,
                    ShopId = room.ShopId,
                    BuyerUserId = room.BuyerUserId,
                    LastMessage = room.LastMessage,
                    LastActiveAt = room.LastActiveAt,
                    DisplayName = buyerInfo != null
                        ? $"{buyerInfo.FirstName} {buyerInfo.LastName}".Trim()
                        : $"Khách hàng {room.BuyerUserId}",
                    DisplayAvatar = buyerInfo?.AvatarUrl ?? string.Empty
                });
            }
        }
        else
        {
            // 2. Dành cho Người mua (Buyer): Lấy tất cả phòng chat của mình
            var rooms = await dbContext.ChatRooms
                .Where(r => r.BuyerUserId == currentUserId)
                .OrderByDescending(r => r.LastActiveAt)
                .ToListAsync();

            if (!rooms.Any()) return Result<List<ConversationDto>>.Success(result);

            var shopIds = rooms.Select(r => r.ShopId).Distinct().ToList();
            var shopDetailDict = new Dictionary<long, BuildingBlocks.Grpc.Services.GetShopShippingInfoResponse>();

            if (shopIds.Any())
            {
                var grpcReq = new BuildingBlocks.Grpc.Services.GetShopsShippingInfoRequest();
                grpcReq.ShopIds.AddRange(shopIds);
                var shopsRes = await sellerClient.GetShopsShippingInfoAsync(grpcReq);
                if (shopsRes != null && shopsRes.ShopsShippingInfo != null)
                {
                    shopDetailDict = shopsRes.ShopsShippingInfo.ToDictionary(s => s.ShopId);
                }
            }

            foreach (var room in rooms)
            {
                shopDetailDict.TryGetValue(room.ShopId, out var shopInfo);
                string displayName = shopInfo?.ShopName ?? $"Cửa hàng {room.ShopId}";

                result.Add(new ConversationDto
                {
                    RoomId = room.Id,
                    ShopId = room.ShopId,
                    BuyerUserId = room.BuyerUserId,
                    LastMessage = room.LastMessage,
                    LastActiveAt = room.LastActiveAt,
                    DisplayName = displayName,
                    DisplayAvatar = string.Empty
                });
            }
        }

        return Result<List<ConversationDto>>.Success(result);
    }
}
