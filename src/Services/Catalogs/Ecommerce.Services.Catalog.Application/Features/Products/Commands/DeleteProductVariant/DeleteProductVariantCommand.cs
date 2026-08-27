using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;

public record DeleteProductVariantCommand(long ProductId, long VariantId) : ICommand<bool>;
