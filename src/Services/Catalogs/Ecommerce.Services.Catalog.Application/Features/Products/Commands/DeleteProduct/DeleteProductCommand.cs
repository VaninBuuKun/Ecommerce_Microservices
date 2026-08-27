using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;

public record DeleteProductCommand(long Id) : ICommand<Product>;
