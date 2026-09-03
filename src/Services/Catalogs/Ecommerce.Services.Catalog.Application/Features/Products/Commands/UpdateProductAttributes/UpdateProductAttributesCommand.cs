using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductAttributes;

public record UpdateProductAttributesCommand(long ProductId, string? AttributesJson) : ICommand<bool>;
