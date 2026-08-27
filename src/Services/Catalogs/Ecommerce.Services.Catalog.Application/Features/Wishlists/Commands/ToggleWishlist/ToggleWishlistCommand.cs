using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Commands.ToggleWishlist;

public record ToggleWishlistCommand(long CustomerId, long ProductId) : ICommand<bool>;
