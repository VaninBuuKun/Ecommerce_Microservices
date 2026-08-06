using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ActivateShop;

public record ActivateShopCommand(long ShopId, long RequestingUserId, bool IsAdmin) : ICommand;
