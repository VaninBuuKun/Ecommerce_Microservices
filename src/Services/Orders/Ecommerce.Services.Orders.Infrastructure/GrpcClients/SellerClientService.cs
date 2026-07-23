using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class SellerClientService(
    SellerGrpc.SellerGrpcClient client,
    ILogger<SellerClientService> logger)
    : ISellerService
{
    public async Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long userId, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("Calling Seller gRPC to validate Shop {ShopId} ownership for User {UserId}", shopId, userId);
            
            var response = await client.ValidateShopOwnerAsync(new ValidateShopOwnerRequest
            {
                ShopId = shopId,
                UserId = userId
            }, cancellationToken: cancellationToken);

            if (!response.IsActive)
            {
                logger.LogWarning("Shop {ShopId} is not active", shopId);
                return Result<bool>.Failure("Cửa hàng hiện tại đang không hoạt động", EErrorCode.Forbidden);
            }

            return Result<bool>.Success(response.IsOwner);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "gRPC error validating shop owner for Shop {ShopId}", shopId);
            return ex.ToResultFailure<bool>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error validating shop owner for Shop {ShopId}", shopId);
            return Result<bool>.Failure($"Lỗi hệ thống khi xác thực cửa hàng: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
