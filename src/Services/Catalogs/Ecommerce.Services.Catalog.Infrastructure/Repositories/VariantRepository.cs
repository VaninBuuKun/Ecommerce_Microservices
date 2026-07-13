using Ardalis.Specification;
using Ardalis.Specification.EntityFrameworkCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Catalog.Infrastructure.Repositories;

public class VariantRepository(ProductDbContext context) : GenericEfRepository<ProductVariant, Guid, ProductDbContext>(context), IVariantRepository
{
    public async Task<List<ProductVariant>> GetVariantsForUpdateAsync(List<Guid> variantIds, CancellationToken cancellationToken = default)
    {
        var parameters = variantIds.Select((id, index) => $"{{{index}}}").ToList();
        //Sẽ tạo ra câu lệnh in({0}, {1}, {2}, ...).
        var sql = $"SELECT * FROM ProductVariants WHERE Id IN ({string.Join(",", parameters)}) FOR UPDATE";
        var parameterValues = variantIds.Cast<object>().ToArray();
        //Thể theo thứ tự.
        return await context.ProductVariants
            .FromSqlRaw(sql, parameterValues)
            .Include(x => x.Product)
            .Include(x => x.Options)
            .ThenInclude(o => o.OptionValue)
            .ThenInclude(ov => ov.Option)
            .ToListAsync(cancellationToken);
    }
}