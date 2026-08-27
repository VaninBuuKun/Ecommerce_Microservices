using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Commons.Repositories;

public interface IVariantRepository : IGenericEfRepository<ProductVariant, long>
{
    public Task<List<ProductVariant>> GetVariantsForUpdateAsync(List<long> variantIds, CancellationToken cancellationToken = default);
}