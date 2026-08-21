using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ToggleFollowShop;

public record ToggleFollowShopCommand(long CustomerId, long ShopId) : ICommand<bool>;
