using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;

public record GetProductsQuery : IQuery<IEnumerable<ProductResponse>>;

public class GetProductsQueryHandler(
    IEfUnitOfWork unitOfWork, IMapper mapper,
    ILogger<GetProductsQueryHandler> logger)
    : QueryHandler<GetProductsQuery, IEnumerable<ProductResponse>>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();

    protected override async Task<Result<IEnumerable<ProductResponse>>> HandleQueryAsync(GetProductsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductsWithVariantsAndOptionsSpec();
            var products = await _productRepository.GetListAsync(spec, cancellationToken);
            
            var result = mapper.Map<List<ProductResponse>>(products);
            return Result<IEnumerable<ProductResponse>>.Success(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi lấy danh sách sản phẩm");
            return Result<IEnumerable<ProductResponse>>.ValidationFailure("Có lỗi xảy ra");
        }
    }

    
}
