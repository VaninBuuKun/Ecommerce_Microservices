using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Commons.Repositories;

public interface IProductRepository : IGenericEfRepository<Product, Guid>
{
    Task UpdateProductRatingsAsync(Guid productId, int newRating, CancellationToken cancellationToken = default);
}
