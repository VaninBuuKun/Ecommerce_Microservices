using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

using Ecommerce.Services.Catalog.Application.Commons.Interfaces;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProductById;

public record GetProductByIdQuery(Guid Id) : IQuery<ProductResponse>;

public class GetProductByIdQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetProductByIdQueryHandler> logger, 
    IMapper mapper,
    ISellerService sellerService)
    : QueryHandler<GetProductByIdQuery, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();

    protected override async Task<Result<ProductResponse>> HandleQueryAsync(GetProductByIdQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(query.Id);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }
            
            var response = mapper.Map<ProductResponse>(product);

            // Fetch shop details via gRPC
            if (product.ShopId > 0)
            {
                var shopResult = await sellerService.GetShopShippingInfoAsync(product.ShopId);
                if (shopResult.IsSuccess && shopResult.Value != null)
                {
                    response.ShopName = shopResult.Value.ShopName;
                    response.ShopPhone = shopResult.Value.Phone;
                    response.ShopAddress = shopResult.Value.AddressLine;
                    response.ShopRecipient = shopResult.Value.RecipientName;
                    response.ShopOwnerId = shopResult.Value.OwnerUserId;
                }
            }

            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            string errorMessage = $"Có lỗi xảy ra khi lấy sản phẩm {query.Id}";
            logger.LogError(ex, errorMessage);
            return Result<ProductResponse>.Failure(errorMessage, EErrorCode.InternalServerError);
        }
    }

}

