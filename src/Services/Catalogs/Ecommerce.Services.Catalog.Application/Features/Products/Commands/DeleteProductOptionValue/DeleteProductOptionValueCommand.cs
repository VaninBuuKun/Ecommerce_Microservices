using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductOptionValue;

public record DeleteProductOptionValueCommand(long ProductId, long OptionId, long ValueId) : ICommand<bool>;
