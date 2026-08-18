using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.ValidateShopOwner;

public record ValidateShopOwnerResultDto(bool IsOwner, string ShopName, bool IsActive);

public record ValidateShopOwnerQuery(long ShopId, long UserId) : IQuery<ValidateShopOwnerResultDto>;
