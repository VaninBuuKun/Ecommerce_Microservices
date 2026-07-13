using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProductVariant;


public class CreateProductVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<CreateProductVariantCommandHandler> logger,
    IMapper mapper
) : CommandHandler<CreateProductVariantCommand, VariantDto>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<VariantDto>> HandleCommandAsync(CreateProductVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<VariantDto>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            var createdVariant = product.AddVariant(
                command.Sku,
                command.Price,
                command.AvailableStocks,
                command.OptionValueIds
            );

            _variantRepository.Add(createdVariant);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var loadSpec = new VariantByIdWithProductAndOptionsSpec(createdVariant.Id);
            var loadedVariant = await _variantRepository.FirstOrDefaultAsync(loadSpec, cancellationToken);

            var response = mapper.Map<VariantDto>(loadedVariant ?? createdVariant);
            return Result<VariantDto>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while creating variant for product {ProductId}", command.ProductId);
            return Result<VariantDto>.ValidationFailure(ex.Message);
        }
    }
}
