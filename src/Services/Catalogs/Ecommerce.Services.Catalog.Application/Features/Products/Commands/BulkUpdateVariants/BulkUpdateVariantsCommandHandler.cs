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

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;

public class BulkUpdateVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<BulkUpdateVariantsCommandHandler> logger,
    IMapper mapper
) : CommandHandler<BulkUpdateVariantsCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductOption, long> _productOptionRepository = unitOfWork.Repository<ProductOption, long>();
    private readonly IGenericEfRepository<ProductOptionValue, long> _productOptionValueRepository = unitOfWork.Repository<ProductOptionValue, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();

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

            // -------------------------------------------------------------
            // STEP 1: UPSERT OPTIONS & OPTION VALUES
            // -------------------------------------------------------------
            var activeOptions = product.Options.Where(o => !o.IsDeleted).ToList();

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
                    optionEntity = product.AddOption(optReq.Name, i);
                    _productOptionRepository.Add(optionEntity);
                }

                var activeValues = optionEntity.Values.Where(v => !v.IsDeleted).ToList();
                var processedValueIds = new HashSet<long>();

                for (int j = 0; j < optReq.Values.Count; j++)
                {
                    var valReq = optReq.Values[j];

                    var existingVal = valReq.Id.HasValue 
                        ? activeValues.FirstOrDefault(v => v.Id == valReq.Id.Value) 
                        : null;

                    if (existingVal != null)
                    {
                        existingVal.Update(valReq.Value, j, valReq.ImageUrl);
                        _productOptionValueRepository.Update(existingVal);
                        processedValueIds.Add(existingVal.Id);
                    }
                    else
                    {
                        var valueEntity = new ProductOptionValue(optionEntity.Id, valReq.Value, j, valReq.ImageUrl);
                        optionEntity.AddValue(valueEntity);
                        _productOptionValueRepository.Add(valueEntity);
                    }
                }

                var valuesToDelete = activeValues.Where(v => !processedValueIds.Contains(v.Id));
                foreach (var val in valuesToDelete)
                {
                    val.SoftDelete();
                    _productOptionValueRepository.Update(val);
                }
            }

            // SaveChanges Phase 1: Đảm bảo PostgreSQL sinh ID thật (long > 0) cho tất cả Option & OptionValue mới
            await unitOfWork.SaveChangesAsync(cancellationToken);

            // -------------------------------------------------------------
            // STEP 2: BUILD OPTION VALUE MAP FROM DB WITH REAL LONG IDs
            // -------------------------------------------------------------
            var optionValueNameToIdMap = new Dictionary<(string OptionName, string ValueName), long>();
            foreach (var opt in product.Options.Where(o => !o.IsDeleted))
            {
                foreach (var val in opt.Values.Where(v => !v.IsDeleted))
                {
                    var key = GetMapKey(opt.Name, val.Value);
                    optionValueNameToIdMap[key] = val.Id;
                }
            }

            // -------------------------------------------------------------
            // STEP 3: UPSERT VARIANTS & LINK VARIANT OPTIONS
            // -------------------------------------------------------------
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
                    var createdVariant = product.AddVariant(
                        varReq.Price,
                        varReq.AvailableStock,
                        null,
                        varReq.DiscountPrice
                    );
                    createdVariant.UpdateDetails(
                        varReq.Price,
                        varReq.AvailableStock,
                        varReq.Weight,
                        varReq.Length,
                        varReq.Width,
                        varReq.Height,
                        varReq.DiscountPrice);

                    _variantRepository.Add(createdVariant);

                    foreach (var ovReq in varReq.OptionValues)
                    {
                        var key = GetMapKey(ovReq.OptionName, ovReq.ValueName);
                        if (optionValueNameToIdMap.TryGetValue(key, out var valId))
                        {
                            var varOpt = new ProductVariantOption(createdVariant.Id, valId);
                            createdVariant.AddOption(varOpt);
                        }
                    }
                }
            }
            else
            {
                var activeVariantDict = activeVariants.ToDictionary(v => v.Id);
                var processedVariantIds = new HashSet<long>();

                foreach (var varReq in command.Variants)
                {
                    if (varReq.Id.HasValue && activeVariantDict.TryGetValue(varReq.Id.Value, out var existingVariant))
                    {
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
                        var createdVariant = product.AddVariant(
                            varReq.Price,
                            varReq.AvailableStock,
                            null,
                            varReq.DiscountPrice
                        );
                        createdVariant.UpdateDetails(
                            varReq.Price,
                            varReq.AvailableStock,
                            varReq.Weight,
                            varReq.Length,
                            varReq.Width,
                            varReq.Height,
                            varReq.DiscountPrice);

                        _variantRepository.Add(createdVariant);
                        if (createdVariant.Id > 0)
                        {
                            processedVariantIds.Add(createdVariant.Id);
                        }

                        foreach (var ovReq in varReq.OptionValues)
                        {
                            var key = GetMapKey(ovReq.OptionName, ovReq.ValueName);
                            if (optionValueNameToIdMap.TryGetValue(key, out var valId))
                            {
                                var varOpt = new ProductVariantOption(createdVariant.Id, valId);
                                createdVariant.AddOption(varOpt);
                            }
                        }
                    }
                }
                
                var variantsToDelete = activeVariantDict.Values.Where(v => !processedVariantIds.Contains(v.Id));
                foreach (var variant in variantsToDelete)
                {
                    variant.SoftDelete();
                    _variantRepository.Update(variant);
                }
            }
            
            product.RecalculateCachedPricesAndStock();
            _productRepository.Update(product);

            // SaveChanges Phase 2: Lưu hoàn tất Variants và ProductVariantOptions
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

        if (activeOptions.Count != incomingOptions.Count)
        {
            return true;
        }

        foreach (var activeOpt in activeOptions)
        {
            bool isStillPresent = incomingOptions.Any(inc => inc.Id.HasValue && inc.Id.Value == activeOpt.Id);
            if (!isStillPresent)
            {
                return true;
            }
        }

        return false;
    }

    private static (string OptionName, string ValueName) GetMapKey(string optionName, string valueName)
    {
        return (optionName.Trim().ToLowerInvariant(), valueName.Trim().ToLowerInvariant());
    }
}