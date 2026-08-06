using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.SuspendShop;

public record SuspendShopCommand(long ShopId, long RequestingUserId, bool IsAdmin) : ICommand;
