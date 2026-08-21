using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetPublicShopById;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetFollowedShops;

public record GetFollowedShopsQuery(long CustomerId) : IQuery<List<PublicShopDetailDto>>;
