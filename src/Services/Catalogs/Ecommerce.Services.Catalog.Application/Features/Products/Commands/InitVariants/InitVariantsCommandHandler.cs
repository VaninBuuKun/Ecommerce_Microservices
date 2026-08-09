using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;

public class InitVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<InitVariantsCommandHandler> logger,
    IMapper mapper
) : CommandHandler<InitVariantsCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductOption, Guid> _productOptionRepository = unitOfWork.Repository<ProductOption, Guid>();
    private readonly IGenericEfRepository<ProductOptionValue, Guid> _productOptionValueRepository = unitOfWork.Repository<ProductOptionValue, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(InitVariantsCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            // 1. Reset existing options and variants
            product.ClearVariantsAndOptions();

            // Key = OptionName-ValueName -> OptionValue.Id
            var optionAndValueToIdMap = new Dictionary<string, Guid>();

            // 2. Add options and option values sequentially (using index as SortOrder)
            for (int i = 0; i < command.Options.Count; i++)
            {
                var optDto = command.Options[i];
                var createdOption = product.AddOption(optDto.Name);
                createdOption.Update(optDto.Name, i);
                _productOptionRepository.Add(createdOption);

                for (int j = 0; j < optDto.Values.Count; j++)
                {
                    var valDto = optDto.Values[j];
                    var createdValue = product.AddOptionValue(createdOption.Id, valDto.Value);
                    createdValue.Update(valDto.Value, j, valDto.ImageUrl);
                    _productOptionValueRepository.Add(createdValue);

                    var lookupKey = $"{optDto.Name}-{valDto.Value}";
                    optionAndValueToIdMap[lookupKey] = createdValue.Id;
                }
            }

            // 3. Add Variants
            foreach (var varDto in command.Variants)
            {
                var optionValueIds = new List<Guid>();
                foreach (var variantOptionValue in varDto.OptionValues)
                {
                    var lookupKey = $"{variantOptionValue.OptionName}-{variantOptionValue.ValueName}";
                    if (optionAndValueToIdMap.TryGetValue(lookupKey, out var valId))
                    {
                        optionValueIds.Add(valId);
                    }
                }

                var createdVariant = product.AddVariant(
                    varDto.Price,
                    varDto.AvailableStock,
                    optionValueIds,
                    varDto.Weight ?? 0,
                    varDto.Length ?? 0,
                    varDto.Width ?? 0,
                    varDto.Height ?? 0
                );
                _variantRepository.Add(createdVariant);
            }

            _productRepository.Update(product);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during InitVariants for product {ProductId}", command.ProductId);
            return Result<ProductResponse>.ValidationFailure(ex.Message);
        }
    }
}
