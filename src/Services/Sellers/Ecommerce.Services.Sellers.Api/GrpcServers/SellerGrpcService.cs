using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Grpc.Core;

namespace Ecommerce.Services.Sellers.Api.GrpcServers;

public class SellerGrpcService(IEfUnitOfWork unitOfWork) : SellerGrpc.SellerGrpcBase
{
    private readonly IGenericEfRepository<Shop, long> _shopRepository = unitOfWork.Repository<Shop, long>();

    public override async Task<ValidateShopOwnerResponse> ValidateShopOwner(ValidateShopOwnerRequest request, ServerCallContext context)
    {
        var shop = await _shopRepository.FirstOrDefaultAsync(s => s.Id == request.ShopId);
        
        if (shop == null)
        {
            return new ValidateShopOwnerResponse 
            { 
                IsOwner = false,
                IsActive = false
            };
        }

        return new ValidateShopOwnerResponse
        {
            IsOwner = shop.OwnerUserId == request.UserId,
            ShopName = shop.Name,
            IsActive = shop.Status == ShopStatus.Active
        };
    }

    public override async Task<GetShopsByIdsResponse> GetShopsByIds(GetShopsByIdsRequest request, ServerCallContext context)
    {
        var shopIds = request.ShopIds.ToList();
        var shops = await _shopRepository.GetAllAsync(s => shopIds.Contains(s.Id));

        var response = new GetShopsByIdsResponse();
        foreach (var shop in shops)
        {
            response.Shops.Add(new ShopGrpcModel
            {
                ShopId = shop.Id,
                Name = shop.Name
            });
        }

        return response;
    }

    public override async Task<GetShopShippingInfoResponse> GetShopShippingInfo(GetShopShippingInfoRequest request, ServerCallContext context)
    {
        var shop = await _shopRepository.FirstOrDefaultAsync(s => s.Id == request.ShopId);
        if (shop == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"Shop with ID {request.ShopId} not found."));
        }

        return new GetShopShippingInfoResponse
        {
            ShopId = shop.Id,
            ShopName = shop.Name,
            Phone = shop.PickUpAddress?.Phone ?? string.Empty,
            AddressLine = shop.PickUpAddress?.AddressLine ?? string.Empty,
            WardId = shop.PickUpAddress?.WardId ?? 0,
            DistrictId = shop.PickUpAddress?.DistrictId ?? 0,
            ProvinceId = shop.PickUpAddress?.ProvinceId ?? 0,
            GhnShopId = shop.GhnShopId ?? string.Empty
        };
    }
}
