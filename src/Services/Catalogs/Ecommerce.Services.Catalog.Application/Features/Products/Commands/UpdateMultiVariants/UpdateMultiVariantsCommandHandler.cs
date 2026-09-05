using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateMultiVariants;

public class UpdateMultiVariantsCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateMultiVariantsCommandHandler> logger,
    IMapper mapper,
    ISnowflakeIdGenerator snowflakeIdGenerator
) : CommandHandler<UpdateMultiVariantsCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductOption, long> _optionRepository = unitOfWork.Repository<ProductOption, long>();
    private readonly IGenericEfRepository<ProductOptionValue, long> _optionValueRepository = unitOfWork.Repository<ProductOptionValue, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(UpdateMultiVariantsCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Không tìm thấy sản phẩm trong hệ thống.", EErrorCode.NotFound);
            }

            // 1. Nếu trước đó là Single-variant -> Soft delete Default Variant đơn cũ
            var defaultSingleVariant = product.Variants.FirstOrDefault(v => !v.IsDeleted && !v.VariantOptions.Any());
            if (defaultSingleVariant != null)
            {
                defaultSingleVariant.SoftDelete();
                _variantRepository.Update(defaultSingleVariant);
            }

            var existingOptions = product.Options.Where(o => !o.IsDeleted).ToList();
            bool isStructureChanged = HasOptionStructureChanged(existingOptions, command.Options);

            var activeOptions = product.Options.Where(o => !o.IsDeleted).ToList();
            var incomingOptionIds = command.Options.Where(o => o.Id.HasValue).Select(o => o.Id!.Value).ToHashSet();

            foreach (var opt in activeOptions)
            {
                if (!incomingOptionIds.Contains(opt.Id))
                {
                    opt.SoftDelete();
                    _optionRepository.Update(opt);
                }
            }

            var optionValueNameToIdMap = new Dictionary<(string OptionName, string ValueName), long>();

            for (int i = 0; i < command.Options.Count; i++)
            {
                var optReq = command.Options[i];
                ProductOption currentOpt;

                if (optReq.Id.HasValue && activeOptions.FirstOrDefault(o => o.Id == optReq.Id.Value) is { } existingOpt)
                {
                    currentOpt = existingOpt;
                    currentOpt.Update(optReq.Name, i);
                    _optionRepository.Update(currentOpt);
                }
                else
                {
                    currentOpt = product.AddOption(optReq.Name, i);
                    currentOpt.Id = snowflakeIdGenerator.NewId();
                    _optionRepository.Add(currentOpt);
                }

                var existingValues = currentOpt.Values.Where(v => !v.IsDeleted).ToList();
                var incomingValueIds = optReq.Values.Where(v => v.Id.HasValue).Select(v => v.Id!.Value).ToHashSet();

                foreach (var val in existingValues)
                {
                    if (!incomingValueIds.Contains(val.Id))
                    {
                        val.SoftDelete();
                        _optionValueRepository.Update(val);
                    }
                }

                for (int j = 0; j < optReq.Values.Count; j++)
                {
                    var valReq = optReq.Values[j];
                    ProductOptionValue currentVal;

                    if (valReq.Id.HasValue && existingValues.FirstOrDefault(v => v.Id == valReq.Id.Value) is { } existingVal)
                    {
                        currentVal = existingVal;
                        currentVal.Update(valReq.Value, j, valReq.ImageUrl);
                        _optionValueRepository.Update(currentVal);
                    }
                    else
                    {
                        currentVal = new ProductOptionValue(currentOpt.Id, valReq.Value, j, valReq.ImageUrl)
                        {
                            Id = snowflakeIdGenerator.NewId()
                        };
                        currentOpt.AddValue(currentVal);
                        _optionValueRepository.Add(currentVal);
                    }

                    var key = GetMapKey(optReq.Name, valReq.Value);
                    optionValueNameToIdMap[key] = currentVal.Id;
                }
            }

            // SaveChanges Phase 1: Lưu Options và Values để có đầy đủ Id
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var activeVariants = product.Variants.Where(v => !v.IsDeleted).ToList();

            if (isStructureChanged)
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
                        varReq.DiscountPrice
                    );
                    createdVariant.Id = snowflakeIdGenerator.NewId();
                    createdVariant.UpdateDetails(
                        varReq.Price,
                        varReq.AvailableStock,
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
                            varReq.DiscountPrice);

                        _variantRepository.Update(existingVariant);
                        processedVariantIds.Add(existingVariant.Id);
                    }
                    else
                    {
                        var createdVariant = product.AddVariant(
                            varReq.Price,
                            varReq.AvailableStock,
                            varReq.DiscountPrice
                        );
                        createdVariant.Id = snowflakeIdGenerator.NewId();
                        createdVariant.UpdateDetails(
                            varReq.Price,
                            varReq.AvailableStock,
                            varReq.DiscountPrice);

                        _variantRepository.Add(createdVariant);
                        processedVariantIds.Add(createdVariant.Id);

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
            
            product.RecalculateCachedPrices();
            product.RebuildSearchDocument(product.Category?.Name);
            _productRepository.Update(product);

            // SaveChanges Phase 2: Lưu hoàn tất Variants và ProductVariantOptions
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi cập nhật danh sách biến thể cho sản phẩm {ProductId}", command.ProductId);
            return Result<ProductResponse>.Failure($"Lỗi khi cập nhật biến thể sản phẩm: {ex.Message}", EErrorCode.InternalServerError);
        }
    }

    private static bool HasOptionStructureChanged(
        IReadOnlyCollection<ProductOption> existingOptions,
        List<MultiUpdateOptionDto> incomingOptions)
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
