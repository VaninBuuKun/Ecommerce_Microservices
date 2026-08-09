using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.InitSingleVariant;

public class UpdateProductSaleCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateProductSaleCommandHandler> logger,
    IMapper mapper
) : CommandHandler<UpdateProductSaleCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(UpdateProductSaleCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productRepository.FirstOrDefaultAsync(predicate: p => p.Id == command.ProductId, cancellationToken: cancellationToken, includes: [p => p.Options, p => p.Variants]);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }
            
            product.ClearVariantsAndOptions();

            product.UpdateSaleInfo(command.AvailableStocks, command.Weight, command.Length, command.Width, command.Height, command.Price, command.DiscountPrice);
            
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error configuring single variant product {ProductId}", command.ProductId);
            return Result<ProductResponse>.ValidationFailure(ex.Message);
        }
    }
}
