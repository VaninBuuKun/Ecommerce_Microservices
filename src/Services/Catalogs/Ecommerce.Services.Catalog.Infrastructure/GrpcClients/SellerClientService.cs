using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.GrpcClients;

public class SellerClientService(
    SellerGrpc.SellerGrpcClient grpcClient,
    ILogger<SellerClientService> logger)
    : ISellerService
{
    public async Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long userId)
    {
        try
        {
            var response = await grpcClient.ValidateShopOwnerAsync(new ValidateShopOwnerRequest
            {
                ShopId = shopId,
                UserId = userId
            });

            if (!response.IsActive)
            {
                return Result<bool>.Failure("Cửa hàng hiện đang tạm khóa hoặc chờ Admin phê duyệt.", BuildingBlocks.Shared.Enums.EErrorCode.Forbidden);
            }

            return Result<bool>.Success(response.IsOwner);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi xác thực chủ shop: {Message}", ex.Message);
            return ex.ToResultFailure<bool>();
        }
    }
}
