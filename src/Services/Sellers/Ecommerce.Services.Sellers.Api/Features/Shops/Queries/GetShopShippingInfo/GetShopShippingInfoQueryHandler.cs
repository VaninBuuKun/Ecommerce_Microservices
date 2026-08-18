using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopShippingInfo;

public class GetShopShippingInfoQueryHandler(IEfUnitOfWork unitOfWork) 
    : IQueryHandler<GetShopShippingInfoQuery, ShopShippingInfoDto>,
      IQueryHandler<GetShopsShippingInfoQuery, List<ShopShippingInfoDto>>
{
    public async Task<Result<ShopShippingInfoDto>> Handle(GetShopShippingInfoQuery request, CancellationToken cancellationToken)
    {
        var shopRepo = unitOfWork.Repository<Shop, long>();
        var shop = await shopRepo.FirstOrDefaultAsync(s => s.Id == request.ShopId);

        if (shop == null)
        {
            return Result<ShopShippingInfoDto>.Failure($"Không tìm thấy cửa hàng với ID {request.ShopId}.", EErrorCode.NotFound);
        }

        var dto = MapToDto(shop);
        return Result<ShopShippingInfoDto>.Success(dto);
    }

    public async Task<Result<List<ShopShippingInfoDto>>> Handle(GetShopsShippingInfoQuery request, CancellationToken cancellationToken)
    {
        var shopRepo = unitOfWork.Repository<Shop, long>();
        var shops = await shopRepo.GetAllAsync(s => request.ShopIds.Contains(s.Id));

        var dtos = shops.Select(MapToDto).ToList();
        return Result<List<ShopShippingInfoDto>>.Success(dtos);
    }

    private static ShopShippingInfoDto MapToDto(Shop shop)
    {
        return new ShopShippingInfoDto(
            shop.Id,
            shop.Name,
            shop.PickUpAddress?.Phone ?? string.Empty,
            shop.PickUpAddress?.AddressLine ?? string.Empty,
            shop.PickUpAddress?.WardId ?? 0,
            shop.PickUpAddress?.DistrictId ?? 0,
            shop.PickUpAddress?.ProvinceId ?? 0,
            shop.OwnerUserId,
            shop.PickUpAddress?.RecipientName ?? string.Empty
        );
    }
}
