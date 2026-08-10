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

    public async Task<Result<ShopShippingInfoResultDto>> GetShopShippingInfoAsync(long shopId)
    {
        try
        {
            var response = await grpcClient.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
            {
                ShopId = shopId
            });

            if (response == null)
            {
                return Result<ShopShippingInfoResultDto>.Failure("Không tìm thấy thông tin vận chuyển của cửa hàng.", BuildingBlocks.Shared.Enums.EErrorCode.NotFound);
            }

            var dto = new ShopShippingInfoResultDto(
                response.ShopId,
                response.ShopName,
                response.Phone,
                response.AddressLine,
                response.WardId,
                response.DistrictId,
                response.ProvinceId,
                response.OwnerUserId,
                response.RecipientName
            );

            return Result<ShopShippingInfoResultDto>.Success(dto);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi lấy thông tin vận chuyển của shop {ShopId}: {Message}", shopId, ex.Message);
            return ex.ToResultFailure<ShopShippingInfoResultDto>();
        }
    }
}
