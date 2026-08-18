using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopsByIds;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopShippingInfo;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.ValidateShopOwner;
using Grpc.Core;
using MediatR;

namespace Ecommerce.Services.Sellers.Api.GrpcServers;

public class SellerGrpcServer(ISender sender) : SellerGrpc.SellerGrpcBase
{
    public override async Task<ValidateShopOwnerResponse> ValidateShopOwner(ValidateShopOwnerRequest request, ServerCallContext context)
    {
        var result = await sender.Send(new ValidateShopOwnerQuery(request.ShopId, request.UserId), context.CancellationToken);

        if (!result.IsSuccess || result.Value == null)
        {
            return new ValidateShopOwnerResponse { IsOwner = false, IsActive = false };
        }

        return new ValidateShopOwnerResponse
        {
            IsOwner = result.Value.IsOwner,
            ShopName = result.Value.ShopName,
            IsActive = result.Value.IsActive
        };
    }

    public override async Task<GetShopsByIdsResponse> GetShopsByIds(GetShopsByIdsRequest request, ServerCallContext context)
    {
        var shopIds = request.ShopIds.ToList();
        var result = await sender.Send(new GetShopsByIdsQuery(shopIds), context.CancellationToken);

        var response = new GetShopsByIdsResponse();
        if (result.IsSuccess && result.Value != null)
        {
            foreach (var shop in result.Value)
            {
                response.Shops.Add(new ShopGrpcModel
                {
                    ShopId = shop.ShopId,
                    Name = shop.Name
                });
            }
        }

        return response;
    }

    public override async Task<GetShopShippingInfoResponse> GetShopShippingInfo(GetShopShippingInfoRequest request, ServerCallContext context)
    {
        var result = await sender.Send(new GetShopShippingInfoQuery(request.ShopId), context.CancellationToken);

        if (!result.IsSuccess || result.Value == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, result.Message ?? $"Không tìm thấy cửa hàng ID {request.ShopId}"));
        }

        var shop = result.Value;
        return new GetShopShippingInfoResponse
        {
            ShopId = shop.ShopId,
            ShopName = shop.ShopName,
            Phone = shop.Phone,
            AddressLine = shop.AddressLine,
            WardId = shop.WardId,
            DistrictId = shop.DistrictId,
            ProvinceId = shop.ProvinceId,
            OwnerUserId = shop.OwnerUserId,
            RecipientName = shop.RecipientName
        };
    }

    public override async Task<GetShopsShippingInfoResponse> GetShopsShippingInfo(GetShopsShippingInfoRequest request, ServerCallContext context)
    {
        var shopIds = request.ShopIds.ToList();
        var result = await sender.Send(new GetShopsShippingInfoQuery(shopIds), context.CancellationToken);

        var response = new GetShopsShippingInfoResponse();
        if (result.IsSuccess && result.Value != null)
        {
            foreach (var shop in result.Value)
            {
                response.ShopsShippingInfo.Add(new GetShopShippingInfoResponse
                {
                    ShopId = shop.ShopId,
                    ShopName = shop.ShopName,
                    Phone = shop.Phone,
                    AddressLine = shop.AddressLine,
                    WardId = shop.WardId,
                    DistrictId = shop.DistrictId,
                    ProvinceId = shop.ProvinceId,
                    OwnerUserId = shop.OwnerUserId,
                    RecipientName = shop.RecipientName
                });
            }
        }

        return response;
    }
}
