using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetMyProducts;

public record GetMyProductsQuery(long ShopId, long UserId, int page, int pageSize) : ICommand<List<MyProductDto>>;