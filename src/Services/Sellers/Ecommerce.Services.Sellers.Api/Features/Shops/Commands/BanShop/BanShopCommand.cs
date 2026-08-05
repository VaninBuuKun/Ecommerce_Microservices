using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.BanShop;

public record BanShopCommand(long ShopId) : ICommand;
