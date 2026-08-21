using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Queries.GetMyWishlist;

public record GetMyWishlistQuery(long CustomerId) : IQuery<List<ProductResponse>>;
