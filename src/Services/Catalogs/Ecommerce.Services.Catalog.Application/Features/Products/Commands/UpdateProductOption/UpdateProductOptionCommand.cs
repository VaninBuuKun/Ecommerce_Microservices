using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductOption;

public record UpdateProductOptionCommand(Guid OptionId, string Name) : ICommand<bool>;

