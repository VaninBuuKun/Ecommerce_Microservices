using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.EfCore.Persistence.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Catalog.Infrastructure.Repositories;

public class ProductRepository(ProductDbContext context) 
    : GenericEfRepository<Product, Guid, ProductDbContext>(context), IProductRepository
{
    public async Task UpdateProductRatingsAsync(Guid productId, int newRating, CancellationToken cancellationToken = default)
    {
        // Thực thi câu lệnh SQL UPDATE nguyên tử (Atomic Update) ở mức Database chống tranh chấp (Lost Update)
        await context.Products
            .Where(p => p.Id == productId)
            .ExecuteUpdateAsync(setter => setter
                .SetProperty(p => p.RatingSum, p => p.RatingSum + newRating)
                .SetProperty(p => p.ReviewCount, p => p.ReviewCount + 1)
                .SetProperty(p => p.AverageRating, p => Math.Round((double)(p.RatingSum + newRating) / (p.ReviewCount + 1), 1)),
                cancellationToken);
    }
}
