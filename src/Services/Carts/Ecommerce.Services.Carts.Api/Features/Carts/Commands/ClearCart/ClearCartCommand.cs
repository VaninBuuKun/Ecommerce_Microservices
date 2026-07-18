using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
namespace Ecommerce.Services.Carts.Api.Features.Carts.Commands.ClearCart;

public record ClearCartCommand(long CustomerId, List<Guid> VariantIds) : ICommand;


