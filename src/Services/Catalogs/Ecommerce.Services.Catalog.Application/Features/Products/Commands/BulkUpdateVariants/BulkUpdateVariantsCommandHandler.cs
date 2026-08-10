using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;

public class BulkUpdateVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<BulkUpdateVariantsCommandHandler> logger,
    IMapper mapper
) : CommandHandler<BulkUpdateVariantsCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductOption, Guid> _productOptionRepository = unitOfWork.Repository<ProductOption, Guid>();
    private readonly IGenericEfRepository<ProductOptionValue, Guid> _productOptionValueRepository = unitOfWork.Repository<ProductOptionValue, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(
        BulkUpdateVariantsCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product is null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }
            
            bool isOptionStructureChanged = HasOptionStructureChanged(product.Options, command.Options);

            var optionValueNameToIdMap = new Dictionary<(string OptionName, string ValueName), Guid>();

            // -------------------------------------------------------------
            // STEP 1: UPSERT OPTIONS & OPTION VALUES (MATCH THUẦN ID)
            // -------------------------------------------------------------
            var activeOptions = product.Options.Where(o => !o.IsDeleted).ToList();
            var processedOptionIds = new HashSet<Guid>();

            var incomingOptionIds = command.Options
                .Where(o => o.Id.HasValue)
                .Select(o => o.Id!.Value);
            
            var optionsToDelete = activeOptions.Where(o => !incomingOptionIds.Contains(o.Id)).ToList();
            foreach (var opt in optionsToDelete)
            {
                opt.SoftDelete();
                _productOptionRepository.Update(opt);
            }

            for (int i = 0; i < command.Options.Count; i++)
            {
                var optReq = command.Options[i];
                
                var existingOpt = optReq.Id.HasValue 
                    ? activeOptions.FirstOrDefault(o => o.Id == optReq.Id.Value) 
                    : null;

                ProductOption optionEntity;

                if (existingOpt != null)
                {
                    existingOpt.Update(optReq.Name, i);
                    _productOptionRepository.Update(existingOpt);
                    optionEntity = existingOpt;
                }
                else
                {
                    optionEntity = product.AddOption(optReq.Name);
                    optionEntity.Update(optReq.Name, i);
                    _productOptionRepository.Add(optionEntity);
                }

                processedOptionIds.Add(optionEntity.Id);

                var activeValues = optionEntity.Values.Where(v => !v.IsDeleted).ToList();
                var processedValueIds = new HashSet<Guid>();

                for (int j = 0; j < optReq.Values.Count; j++)
                {
                    var valReq = optReq.Values[j];

                    // CHỈ MATCH THEO ID
                    var existingVal = valReq.Id.HasValue 
                        ? activeValues.FirstOrDefault(v => v.Id == valReq.Id.Value) 
                        : null;

                    ProductOptionValue valueEntity;

                    if (existingVal != null)
                    {
                        existingVal.Update(valReq.Value, j, valReq.ImageUrl); // Hỗ trợ RENAME tên Value
                        _productOptionValueRepository.Update(existingVal);
                        valueEntity = existingVal;
                    }
                    else
                    {
                        valueEntity = product.AddOptionValue(optionEntity.Id, valReq.Value);
                        valueEntity.Update(valReq.Value, j, valReq.ImageUrl);
                        _productOptionValueRepository.Add(valueEntity);
                    }

                    processedValueIds.Add(valueEntity.Id);

                    // Map tên mới nhất nhận từ DTO với Id thực tế của Value
                    var mapKey = GetMapKey(optReq.Name, valReq.Value);
                    optionValueNameToIdMap[mapKey] = valueEntity.Id;
                }

                // Soft delete các Value không còn truyền Id lên
                var valuesToDelete = activeValues.Where(v => !processedValueIds.Contains(v.Id));
                foreach (var val in valuesToDelete)
                {
                    val.SoftDelete();
                    _productOptionValueRepository.Update(val);
                }
            }
            var activeVariants = product.Variants.Where(v => !v.IsDeleted).ToList();

            if (isOptionStructureChanged)
            {
                foreach (var oldVariant in activeVariants)
                {
                    oldVariant.SoftDelete();
                    _variantRepository.Update(oldVariant);
                }

                foreach (var varReq in command.Variants)
                {
                    var optionValueIds = GetOptionValueIds(varReq.OptionValues, optionValueNameToIdMap);

                    var createdVariant = product.AddVariant(
                        varReq.Price,
                        varReq.AvailableStock,
                        optionValueIds,
                        varReq.Weight,
                        varReq.Length,
                        varReq.Width,
                        varReq.Height,
                        varReq.DiscountPrice
                    );

                    _variantRepository.Add(createdVariant);
                }
            }
            else
            {
                var activeVariantDict = activeVariants.ToDictionary(v => v.Id);
                var processedVariantIds = new HashSet<Guid>();

                foreach (var varReq in command.Variants)
                {
                    var optionValueIds = GetOptionValueIds(varReq.OptionValues, optionValueNameToIdMap);

                    if (varReq.Id.HasValue && activeVariantDict.TryGetValue(varReq.Id.Value, out var existingVariant))
                    {
                        // UPDATE
                        existingVariant.UpdateDetails(
                            varReq.Price,
                            varReq.AvailableStock,
                            varReq.Weight,
                            varReq.Length,
                            varReq.Width,
                            varReq.Height,
                            varReq.DiscountPrice);

                        _variantRepository.Update(existingVariant);
                        processedVariantIds.Add(existingVariant.Id);
                    }
                    else
                    {
                        // CREATE
                        var createdVariant = product.AddVariant(
                            varReq.Price,
                            varReq.AvailableStock,
                            optionValueIds,
                            varReq.Weight,
                            varReq.Length,
                            varReq.Width,
                            varReq.Height,
                            varReq.DiscountPrice
                        );

                        _variantRepository.Add(createdVariant);
                        processedVariantIds.Add(createdVariant.Id);
                    }
                }
                
                var variantsToDelete = activeVariantDict.Values.Where(v => !processedVariantIds.Contains(v.Id));
                foreach (var variant in variantsToDelete)
                {
                    variant.SoftDelete();
                    _variantRepository.Update(variant);
                }
            }
            
            product.SyncProductPrice();
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error bulk updating variants for product {ProductId}", command.ProductId);
            return Result<ProductResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    private static bool HasOptionStructureChanged(
        IReadOnlyCollection<ProductOption> existingOptions,
        List<BulkUpdateOptionDto> incomingOptions)
    {
        var activeOptions = existingOptions.Where(o => !o.IsDeleted).ToList();

        // 1. Số lượng nhóm Option khác nhau
        if (activeOptions.Count != incomingOptions.Count)
        {
            return true;
        }

        // 2. Kiểm tra xem toàn bộ Option Id cũ có xuất hiện trong payload mới hay không
        foreach (var activeOpt in activeOptions)
        {
            bool isStillPresent = incomingOptions.Any(inc => inc.Id.HasValue && inc.Id.Value == activeOpt.Id);
            if (!isStillPresent)
            {
                return true; // Có Option cũ bị xóa/thay thế -> Structure Changed
            }
        }

        return false;
    }

    private static (string OptionName, string ValueName) GetMapKey(string optionName, string valueName)
    {
        return (optionName.Trim().ToLowerInvariant(), valueName.Trim().ToLowerInvariant());
    }

    private static List<Guid> GetOptionValueIds(
        List<BulkUpdateVariantOptionValueDto> optionValues,
        Dictionary<(string OptionName, string ValueName), Guid> map)
    {
        var ids = new List<Guid>();
        foreach (var ov in optionValues)
        {
            var key = GetMapKey(ov.OptionName, ov.ValueName);
            if (map.TryGetValue(key, out var valueId))
            {
                ids.Add(valueId);
            }
        }
        return ids;
    }
}