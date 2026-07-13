using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;

public class DeleteProductVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<DeleteProductVariantCommandHandler> logger
) : CommandHandler<DeleteProductVariantCommand, bool>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteProductVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var variant = await _variantRepository.GetByIdAsync(command.VariantId, cancellationToken);
            if (variant == null)
            {
                return Result<bool>.Failure("Variant Not Found", EErrorCode.NotFound);
            }

            var spec = new ProductWithVariantsAndOptionsSpec(variant.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<bool>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            product.RemoveVariant(command.VariantId);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while deleting variant {VariantId}", command.VariantId);
            return Result<bool>.ValidationFailure(ex.Message);
        }
    }
}
