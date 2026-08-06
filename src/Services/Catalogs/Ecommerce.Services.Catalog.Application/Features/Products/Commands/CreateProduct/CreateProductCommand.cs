using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand(long ShopId, string Name, string Description, string thumbnailUrl) : ICommand<ProductResponse>;

