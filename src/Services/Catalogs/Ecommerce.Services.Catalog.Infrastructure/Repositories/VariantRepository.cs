using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.EfCore.Persistence.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Catalog.Infrastructure.Repositories;

public class VariantRepository(ProductDbContext context) : GenericEfRepository<ProductVariant, long, ProductDbContext>(context), IVariantRepository
{
    public async Task<List<ProductVariant>> GetVariantsForUpdateAsync(List<long> variantIds, CancellationToken cancellationToken = default)
    {
        var parameters = variantIds.Select((id, index) => $"{{{index}}}").ToList();
        var sql = $"SELECT * FROM \"ProductVariants\" WHERE \"Id\" IN ({string.Join(",", parameters)}) FOR UPDATE";
        var parameterValues = variantIds.Cast<object>().ToArray();
        return await context.ProductVariants
            .FromSqlRaw(sql, parameterValues)
            .Include(x => x.Product)
            .Include(x => x.VariantOptions)
            .ThenInclude(o => o.OptionValue)
            .ThenInclude(ov => ov.Option)
            .ToListAsync(cancellationToken);
    }
}