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

public class InitSingleVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<InitSingleVariantCommandHandler> logger,
    IMapper mapper
) : CommandHandler<InitSingleVariantCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(InitSingleVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            var activeOptions = product.Options.Where(o => !o.IsDeleted).ToList();
            var activeVariants = product.Variants.Where(v => !v.IsDeleted).ToList();

            if (activeOptions.Count == 0 && activeVariants.Count == 1)
            {
                // If it is already a single variant product, update the variant in-place
                var singleVariant = activeVariants[0];
                singleVariant.UpdateDetails(
                    command.Sku,
                    command.Price,
                    command.AvailableStocks,
                    command.Weight ?? 0,
                    command.Length ?? 0,
                    command.Width ?? 0,
                    command.Height ?? 0
                );
                _variantRepository.Update(singleVariant);
            }
            else
            {
                // Previously had multiple variants/options, clear and create a single variant
                product.ClearVariantsAndOptions();

                var defaultVariant = product.AddVariant(
                    command.Sku,
                    command.Price,
                    command.AvailableStocks,
                    new List<Guid>(), // No options
                    command.Weight ?? 0,
                    command.Length ?? 0,
                    command.Width ?? 0,
                    command.Height ?? 0
                );

                _variantRepository.Add(defaultVariant);
            }

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
