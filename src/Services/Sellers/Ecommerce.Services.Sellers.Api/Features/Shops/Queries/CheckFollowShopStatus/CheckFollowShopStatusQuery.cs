using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.CheckFollowShopStatus;

public record CheckFollowShopStatusQuery(long CustomerId, long ShopId) : IQuery<bool>;
