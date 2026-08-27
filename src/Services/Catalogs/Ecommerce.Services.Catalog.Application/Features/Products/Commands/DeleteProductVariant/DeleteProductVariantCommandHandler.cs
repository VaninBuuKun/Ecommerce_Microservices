using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;

public class DeleteProductVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<DeleteProductVariantCommandHandler> logger
) : CommandHandler<DeleteProductVariantCommand, bool>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteProductVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productRepository.GetByIdAsync(command.ProductId, cancellationToken);
            if (product == null)
            {
                return Result<bool>.Failure("Product not found", EErrorCode.NotFound);
            }

            product.RemoveVariant(command.VariantId);
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting variant {VariantId}", command.VariantId);
            return Result<bool>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
