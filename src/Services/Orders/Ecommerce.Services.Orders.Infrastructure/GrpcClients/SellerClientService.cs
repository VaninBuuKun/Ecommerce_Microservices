using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Sellers;
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

    public async Task<Result<ShopShippingInfoDto>> GetShopShippingInfoAsync(long shopId, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("Calling Seller gRPC to get shipping info for Shop {ShopId}", shopId);
            var response = await client.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
            {
                ShopId = shopId
            }, cancellationToken: cancellationToken);

            if (response == null)
            {
                return Result<ShopShippingInfoDto>.Failure("Không tìm thấy thông tin vận chuyển của cửa hàng", EErrorCode.NotFound);
            }

            return Result<ShopShippingInfoDto>.Success(new ShopShippingInfoDto
            {
                ShopId = response.ShopId,
                ShopName = response.ShopName,
                Phone = response.Phone,
                AddressLine = response.AddressLine,
                WardId = response.WardId,
                DistrictId = response.DistrictId,
                ProvinceId = response.ProvinceId,
                GhnShopId = response.GhnShopId
            });
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "gRPC error getting shipping info for Shop {ShopId}", shopId);
            return ex.ToResultFailure<ShopShippingInfoDto>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error getting shipping info for Shop {ShopId}", shopId);
            return Result<ShopShippingInfoDto>.Failure($"Lỗi hệ thống khi lấy thông tin vận chuyển của cửa hàng: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
