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
}
