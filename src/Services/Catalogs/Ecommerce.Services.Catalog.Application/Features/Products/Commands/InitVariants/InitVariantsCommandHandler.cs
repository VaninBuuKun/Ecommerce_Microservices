using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductOption, long> _productOptionRepository = unitOfWork.Repository<ProductOption, long>();
    private readonly IGenericEfRepository<ProductOptionValue, long> _productOptionValueRepository = unitOfWork.Repository<ProductOptionValue, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();

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

            var optionAndValueToIdMap = new Dictionary<string, long>();

            for (int i = 0; i < command.Options.Count; i++)
            {
                var optDto = command.Options[i];
                var createdOption = product.AddOption(optDto.Name, i);
                _productOptionRepository.Add(createdOption);

                for (int j = 0; j < optDto.Values.Count; j++)
                {
                    var valDto = optDto.Values[j];
                    var createdValue = new ProductOptionValue(createdOption.Id, valDto.Value, j, valDto.ImageUrl);
                    createdOption.AddValue(createdValue);
                    _productOptionValueRepository.Add(createdValue);

                    var lookupKey = $"{optDto.Name}-{valDto.Value}";
                    optionAndValueToIdMap[lookupKey] = createdValue.Id;
                }
            }

            foreach (var varDto in command.Variants)
            {
                var createdVariant = product.AddVariant(
                    varDto.Price,
                    varDto.AvailableStock,
                    varDto.OptionValues.FirstOrDefault()?.ValueName
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
