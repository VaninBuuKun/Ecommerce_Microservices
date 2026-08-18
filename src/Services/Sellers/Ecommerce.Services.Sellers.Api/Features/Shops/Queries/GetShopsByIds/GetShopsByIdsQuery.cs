using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopsByIds;

public record ShopGrpcDto(long ShopId, string Name);

public record GetShopsByIdsQuery(List<long> ShopIds) : IQuery<List<ShopGrpcDto>>;
