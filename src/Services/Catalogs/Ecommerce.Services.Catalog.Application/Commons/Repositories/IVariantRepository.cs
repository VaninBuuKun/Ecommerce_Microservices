using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Commons.Repositories;

public interface IVariantRepository : IGenericEfRepository<ProductVariant, Guid>
{
    public Task<List<ProductVariant>> GetVariantsForUpdateAsync(List<Guid> variantIds, CancellationToken cancellationToken = default);
}