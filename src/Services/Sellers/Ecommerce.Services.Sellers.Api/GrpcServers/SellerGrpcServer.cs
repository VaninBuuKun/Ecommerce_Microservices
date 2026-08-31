using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.GrpcServers;

public class SellerGrpcServer(IShopService shopService, ILogger<SellerGrpcServer> logger) : SellerGrpc.SellerGrpcBase
{
    public override async Task<ValidateShopOwnerResponse> ValidateShopOwner(ValidateShopOwnerRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC ValidateShopOwner: Kiểm tra quyền sở hữu Shop #{ShopId} cho User #{UserId}", request.ShopId, request.UserId);
        
        var result = await shopService.ValidateShopOwnerAsync(request.ShopId, request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC ValidateShopOwner: Xác thực không hợp lệ cho Shop #{ShopId}, User #{UserId}", request.ShopId, request.UserId);
            return new ValidateShopOwnerResponse { IsOwner = false, IsActive = false };
        }

        return new ValidateShopOwnerResponse
        {
            IsOwner = result.Value.IsOwner,
            ShopName = result.Value.ShopName ?? string.Empty,
            IsActive = result.Value.IsActive
        };
    }

    public override async Task<GetShopsByIdsResponse> GetShopsByIds(GetShopsByIdsRequest request, ServerCallContext context)
    {
        var shopIds = request.ShopIds.ToList();
        logger.LogInformation("gRPC GetShopsByIds: Lấy thông tin {Count} shop", shopIds.Count);

        var result = await shopService.GetShopsByIdsAsync(shopIds);

        var response = new GetShopsByIdsResponse();
        if (result.IsSuccess && result.Value != null)
        {
            foreach (var shop in result.Value)
            {
                response.Shops.Add(new ShopGrpcModel
                {
                    ShopId = shop.Id,
                    Name = shop.Name ?? string.Empty
                });
            }
        }
        else
        {
            logger.LogWarning("gRPC GetShopsByIds: Không tìm thấy hoặc lỗi truy vấn: {Message}", result.Message);
        }

        logger.LogInformation("gRPC GetShopsByIds: Trả về thông tin {Count} shop", response.Shops.Count);
        return response;
    }

    public override async Task<GetShopShippingInfoResponse> GetShopShippingInfo(GetShopShippingInfoRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC GetShopShippingInfo: Lấy địa chỉ vận chuyển của Shop #{ShopId}", request.ShopId);
        
        var result = await shopService.GetShopShippingInfoAsync(request.ShopId);

        if (!result.IsSuccess || result.Value == null)
        {
            var msg = result.Message ?? $"Không tìm thấy thông tin cửa hàng ID {request.ShopId}";
            logger.LogWarning("gRPC GetShopShippingInfo: {Message}", msg);
            throw new RpcException(new Status(StatusCode.NotFound, msg));
        }

        var shop = result.Value;
        return new GetShopShippingInfoResponse
        {
            ShopId = shop.ShopId,
            ShopName = shop.ShopName ?? string.Empty,
            Phone = shop.Phone ?? string.Empty,
            AddressLine = shop.AddressLine ?? string.Empty,
            WardId = shop.WardId,
            DistrictId = shop.DistrictId,
            ProvinceId = shop.ProvinceId,
            OwnerUserId = shop.OwnerUserId,
            RecipientName = shop.RecipientName ?? string.Empty
        };
    }

    public override async Task<GetShopsShippingInfoResponse> GetShopsShippingInfo(GetShopsShippingInfoRequest request, ServerCallContext context)
    {
        var shopIds = request.ShopIds.ToList();
        logger.LogInformation("gRPC GetShopsShippingInfo: Lấy địa chỉ vận chuyển của {Count} shop", shopIds.Count);

        var result = await shopService.GetShopsShippingInfoAsync(shopIds);

        var response = new GetShopsShippingInfoResponse();
        if (result.IsSuccess && result.Value != null)
        {
            foreach (var shop in result.Value)
            {
                response.ShopsShippingInfo.Add(new GetShopShippingInfoResponse
                {
                    ShopId = shop.ShopId,
                    ShopName = shop.ShopName ?? string.Empty,
                    Phone = shop.Phone ?? string.Empty,
                    AddressLine = shop.AddressLine ?? string.Empty,
                    WardId = shop.WardId,
                    DistrictId = shop.DistrictId,
                    ProvinceId = shop.ProvinceId,
                    OwnerUserId = shop.OwnerUserId,
                    RecipientName = shop.RecipientName ?? string.Empty
                });
            }
        }
        else
        {
            logger.LogWarning("gRPC GetShopsShippingInfo: Lỗi truy vấn: {Message}", result.Message);
        }

        logger.LogInformation("gRPC GetShopsShippingInfo: Trả về {Count} địa chỉ shop", response.ShopsShippingInfo.Count);
        return response;
    }
}
