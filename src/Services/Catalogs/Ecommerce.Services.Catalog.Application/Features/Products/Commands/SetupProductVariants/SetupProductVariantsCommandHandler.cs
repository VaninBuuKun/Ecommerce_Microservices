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

public class SetupProductVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<SetupProductVariantsCommandHandler> logger,
    IMapper mapper
) : CommandHandler<SetupProductVariantsCommand, ProductResponse>
{

    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductOption, Guid> _productOptionRepository = unitOfWork.Repository<ProductOption, Guid>();
    private readonly IGenericEfRepository<ProductOptionValue, Guid> _productOptionValueRepository = unitOfWork.Repository<ProductOptionValue, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(SetupProductVariantsCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            //include, then include luôn đi theo cặp.
            // Load Product with Options and Option Values, and active variants using expressions includes
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            // 1. Reset existing options and variants, soft delete
            product.ClearVariantsAndOptions();
            
            //key = optionId-valueId
            Dictionary<string, Guid> optionAndValueToIdMap = new Dictionary<string, Guid>();
            
            // 2. Add new options and variants
            foreach (var optionDto in command.Options)
            {
                var createdOption =  product.AddOption(optionDto.Name);
                
                _productOptionRepository.Add(createdOption);
                
                foreach (var valueDto  in optionDto.Values)
                {
                    var productOptionValue = product.AddOptionValue(createdOption.Id, valueDto.Value);   
                    
                    _productOptionValueRepository.Add(productOptionValue);
                    var lookupKey = $"{optionDto.Name}-{valueDto.Value}";
                    optionAndValueToIdMap[lookupKey] = productOptionValue.Id;
                }
            }
            
            
            // 3. Add Variants
            foreach (var varDto in command.Variants)
            {
                List<Guid> OptionValueIds = new List<Guid>();
                foreach (var variantOptionValue in varDto.OptionValues)
                {
                    var lookupKey = $"{variantOptionValue.OptionName}-{variantOptionValue.ValueName}";
                    
                    OptionValueIds.Add(optionAndValueToIdMap[lookupKey]);
                }
                
                var createdVariant =  product.AddVariant(varDto.Sku, varDto.Price, varDto.AvailableStocks, OptionValueIds);
                
                _variantRepository.Add(createdVariant);
            }
            
            //Lỗi dễ sai ở đây do trình gà.
            //Update chỉ được dùng khi một entity không bị tracking của ef (tức là đối tượng chưa đc load từ db lên bằng first or default, hay là get by id async)
            // _productRepository.Update(product);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while setting up variants for product {ProductId}", command.ProductId);
            return Result<ProductResponse>.ValidationFailure("Error occurred while setting up product variants.");
        }
    }
}
