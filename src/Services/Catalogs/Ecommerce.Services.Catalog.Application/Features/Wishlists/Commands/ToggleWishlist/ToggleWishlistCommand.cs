using System;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Commands.ToggleWishlist;

public record ToggleWishlistCommand(long CustomerId, Guid ProductId) : ICommand<bool>;
