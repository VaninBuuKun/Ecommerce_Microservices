using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ApproveShop;

public record ApproveShopCommand(long ShopId) : ICommand;
