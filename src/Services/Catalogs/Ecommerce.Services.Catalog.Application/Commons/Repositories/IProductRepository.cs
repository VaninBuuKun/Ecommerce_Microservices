using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Commons.Repositories;

public interface IProductRepository : IGenericEfRepository<Product, long>
{
    Task UpdateProductRatingsAsync(long productId, int newRating, CancellationToken cancellationToken = default);
}
