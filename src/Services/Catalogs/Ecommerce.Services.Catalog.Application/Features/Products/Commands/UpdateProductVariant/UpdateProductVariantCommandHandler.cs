using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductVariant;

public class UpdateProductVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateProductVariantCommandHandler> logger,
    IMapper mapper
) : CommandHandler<UpdateProductVariantCommand, VariantDto>
{
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<VariantDto>> HandleCommandAsync(UpdateProductVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new VariantByIdWithProductAndOptionsSpec(command.VariantId);
            var variant = await _variantRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (variant == null)
            {
                return Result<VariantDto>.Failure("Variant Not Found", EErrorCode.NotFound);
            }

            variant.UpdateDetails(command.Sku, command.Price, command.AvailableStocks);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<VariantDto>(variant);
            return Result<VariantDto>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while updating variant {VariantId}", command.VariantId);
            return Result<VariantDto>.ValidationFailure(ex.Message);
        }
    }
}
