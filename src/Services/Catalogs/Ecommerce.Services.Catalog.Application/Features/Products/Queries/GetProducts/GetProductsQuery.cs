using System;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;

public record GetProductsQuery(
    string? SearchTerm, 
    Guid? CategoryId, 
    double? MinRating, 
    string? Cursor, 
    int Limit = 10, 
    string SortBy = "name",
    long? ShopId = null) : IQuery<PagedCursorResponse<ProductResponse>>;

public record PagedCursorResponse<T>(IEnumerable<T> Items, string? NextCursor, bool HasNext);
