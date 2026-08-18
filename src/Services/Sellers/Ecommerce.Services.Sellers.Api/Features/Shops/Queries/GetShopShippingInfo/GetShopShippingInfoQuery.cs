using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopShippingInfo;

public record ShopShippingInfoDto(
    long ShopId,
    string ShopName,
    string Phone,
    string AddressLine,
    long WardId,
    long DistrictId,
    long ProvinceId,
    long OwnerUserId,
    string RecipientName
);

public record GetShopShippingInfoQuery(long ShopId) : IQuery<ShopShippingInfoDto>;

public record GetShopsShippingInfoQuery(List<long> ShopIds) : IQuery<List<ShopShippingInfoDto>>;
