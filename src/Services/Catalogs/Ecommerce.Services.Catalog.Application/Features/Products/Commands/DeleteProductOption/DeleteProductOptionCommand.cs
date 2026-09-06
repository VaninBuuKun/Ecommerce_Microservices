using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductOption;

public record DeleteProductOptionCommand(long ProductId, long OptionId) : ICommand<bool>;
