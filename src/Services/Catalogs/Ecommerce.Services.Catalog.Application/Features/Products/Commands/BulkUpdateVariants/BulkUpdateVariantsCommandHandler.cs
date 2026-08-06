using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductVariant;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariantsCommandHandler;
public class BulkUpdateVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<BulkUpdateVariantsCommandHandler> logger,
    IMapper mapper
) : CommandHandler<BulkUpdateVariantsCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository =
        unitOfWork.Repository<Product, Guid>();

    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository =
        unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(
        BulkUpdateVariantsCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);

            var product = await _productRepository.FirstOrDefaultAsync(
                spec,
                cancellationToken);

            if (product is null)
            {
                return Result<ProductResponse>.Failure(
                    "Product Not Found",
                    EErrorCode.NotFound);
            }

            var activeVariants = product.Variants
                .Where(x => !x.IsDeleted)
                .ToDictionary(x => x.Id);

            var processedVariantIds = new HashSet<Guid>();

            var optionValueMap = product.Options
                .Where(o => !o.IsDeleted)
                .SelectMany(
                    o => o.Values.Where(v => !v.IsDeleted),
                    (o, v) => new
                    {
                        Key = (o.Name, v.Value),
                        ValueId = v.Id
                    })
                .ToDictionary(x => x.Key, x => x.ValueId);

            foreach (var req in command.Variants)
            {
                // Update option value images if provided
                foreach (var optVal in req.OptionValues)
                {
                    var matchingOptionVal = product.Options
                        .SelectMany(o => o.Values)
                        .FirstOrDefault(v => v.Option.Name == optVal.OptionName && v.Value == optVal.ValueName);

                    if (matchingOptionVal != null && optVal.ImageUrl != null && matchingOptionVal.ImageUrl != optVal.ImageUrl)
                    {
                        matchingOptionVal.Update(matchingOptionVal.Value, matchingOptionVal.SortOrder, optVal.ImageUrl);
                    }
                }

                // UPDATE
                if (req.Id.HasValue)
                {
                    if (!activeVariants.TryGetValue(req.Id.Value, out var variant))
                    {
                        return Result<ProductResponse>.Failure(
                            $"Variant {req.Id.Value} not found",
                            EErrorCode.ValidationErrors);
                    }

                    processedVariantIds.Add(variant.Id);

                    variant.UpdateDetails(
                        req.Sku,
                        req.Price,
                        req.AvailableStocks,
                        req.Weight,
                        req.Length,
                        req.Width,
                        req.Height);

                    _variantRepository.Update(variant);

                    continue;
                }

                // CREATE
                var optionValueIds = new List<Guid>();

                foreach (var optionValue in req.OptionValues)
                {
                    if (!optionValueMap.TryGetValue(
                            (optionValue.OptionName, optionValue.ValueName),
                            out var optionValueId))
                    {
                        return Result<ProductResponse>.Failure(
                            $"Option value not found: {optionValue.OptionName}-{optionValue.ValueName}",
                            EErrorCode.ValidationErrors);
                    }

                    optionValueIds.Add(optionValueId);
                }

                var createdVariant = product.AddVariant(
                    req.Sku,
                    req.Price,
                    req.AvailableStocks,
                    optionValueIds,
                    req.Weight ?? 0,
                    req.Length ?? 0,
                    req.Width ?? 0,
                    req.Height ?? 0
                );

                _variantRepository.Add(createdVariant);

                processedVariantIds.Add(createdVariant.Id);
            }

            // SOFT DELETE
            var variantsToDelete = activeVariants.Values
                .Where(v => !processedVariantIds.Contains(v.Id));

            foreach (var variant in variantsToDelete)
            {
                variant.SoftDelete(); // hoặc variant.MarkInactive()
                _variantRepository.Update(variant);
            }

            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);

            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Error bulk updating variants for product {ProductId}",
                command.ProductId);

            return Result<ProductResponse>.ValidationFailure(ex.Message);
        }
    }
}