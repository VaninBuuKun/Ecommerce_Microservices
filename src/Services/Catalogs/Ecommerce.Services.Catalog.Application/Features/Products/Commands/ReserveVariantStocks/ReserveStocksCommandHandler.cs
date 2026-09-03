using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;

public class ReserveStocksCommandHandler(IEfUnitOfWork unitOfWork, IVariantRepository variantRepository) 
    : ICommandHandler<ReserveStocksCommand, ReserveVariantResponse>
{
    public async Task<Result<ReserveVariantResponse>> Handle(ReserveStocksCommand request, CancellationToken cancellationToken)
    {
        if (!request.VariantStockDtos.Any())
        {
            return Result<ReserveVariantResponse>.Failure("Danh sách sản phẩm giữ kho không được rỗng.", EErrorCode.InvalidArgument);
        }

        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var variantItems = request.VariantStockDtos.Where(x => x.VariantId > 0).ToList();
            var productFallbackItems = request.VariantStockDtos.Where(x => x.VariantId <= 0 && x.ProductId > 0).ToList();

            var variantIds = variantItems.Select(x => x.VariantId).Distinct().ToList();
            var variants = variantIds.Any()
                ? await variantRepository.GetVariantsForUpdateAsync(variantIds, cancellationToken)
                : new List<ProductVariant>();
            var variantsDict = variants.ToDictionary(x => x.Id, x => x);

            // Xử lý fallback cho các trường hợp chỉ gửi ProductId (tìm default variant)
            var productRepo = unitOfWork.Repository<Product, long>();
            var fallbackProductIds = productFallbackItems.Select(x => x.ProductId).Distinct().ToList();
            var fallbackProducts = fallbackProductIds.Any()
                ? await productRepo.GetAllAsync(p => fallbackProductIds.Contains(p.Id), cancellationToken: cancellationToken, includes: [p => p.Variants])
                : new List<Product>();
            var fallbackProductsDict = fallbackProducts.ToDictionary(p => p.Id, p => p);

            var response = new ReserveVariantResponse();

            // 1. Kiểm tra tồn kho cho các Biến thể
            foreach (var item in variantItems)
            {
                if (!variantsDict.TryGetValue(item.VariantId, out var variant))
                {
                    await unitOfWork.RollbackAsync(cancellationToken);
                    return Result<ReserveVariantResponse>.Failure($"Không tìm thấy biến thể sản phẩm #{item.VariantId} trong hệ thống.", EErrorCode.NotFound);
                }

                response.VariantStocks.Add(new VariantStockInfo
                {
                    ShopId = variant.Product?.ShopId ?? 0,
                    VariantId = variant.Id,
                    Quantity = item.Quantity,
                    AvailableStock = variant.AvailableStock,
                    ProductName = variant.Product?.Name ?? string.Empty,
                    VariantName = variant.GetVariantName() ?? string.Empty,
                    UnitPrice = variant.DiscountPrice > 0 ? variant.DiscountPrice : variant.Price
                });

                if (item.Quantity > variant.AvailableStock)
                {
                    response.IsSuccess = false;
                }
            }

            // 2. Kiểm tra tồn kho cho fallback items
            var resolvedFallbackVariants = new List<(ProductVariant Variant, int Quantity)>();
            foreach (var item in productFallbackItems)
            {
                if (!fallbackProductsDict.TryGetValue(item.ProductId, out var product))
                {
                    await unitOfWork.RollbackAsync(cancellationToken);
                    return Result<ReserveVariantResponse>.Failure($"Không tìm thấy sản phẩm #{item.ProductId} trong hệ thống.", EErrorCode.NotFound);
                }

                var defaultVariant = product.Variants.FirstOrDefault(v => !v.IsDeleted);
                if (defaultVariant == null)
                {
                    await unitOfWork.RollbackAsync(cancellationToken);
                    return Result<ReserveVariantResponse>.Failure($"Sản phẩm #{item.ProductId} chưa được cấu hình biến thể bán hàng.", EErrorCode.NotFound);
                }

                resolvedFallbackVariants.Add((defaultVariant, item.Quantity));

                response.VariantStocks.Add(new VariantStockInfo
                {
                    ShopId = product.ShopId,
                    VariantId = defaultVariant.Id,
                    Quantity = item.Quantity,
                    AvailableStock = defaultVariant.AvailableStock,
                    ProductName = product.Name,
                    VariantName = defaultVariant.GetVariantName() ?? string.Empty,
                    UnitPrice = defaultVariant.DiscountPrice > 0 ? defaultVariant.DiscountPrice : defaultVariant.Price
                });

                if (item.Quantity > defaultVariant.AvailableStock)
                {
                    response.IsSuccess = false;
                }
            }

            // 3. Thực hiện giữ kho nếu tất cả đều hợp lệ
            if (response.IsSuccess)
            {
                foreach (var item in variantItems)
                {
                    var v = variantsDict[item.VariantId];
                    v.ReserveStock(item.Quantity);
                    if (v.Product != null)
                    {
                        v.Product.RecalculateCachedPrices();
                    }
                }

                foreach (var (defaultVariant, qty) in resolvedFallbackVariants)
                {
                    defaultVariant.ReserveStock(qty);
                    if (defaultVariant.Product != null)
                    {
                        defaultVariant.Product.RecalculateCachedPrices();
                    }
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
                await unitOfWork.CommitAsync(cancellationToken);
            }
            else
            {
                await unitOfWork.RollbackAsync(cancellationToken);
                response.ErrorMessage = "Một số sản phẩm không đủ số lượng tồn kho để đặt. Vui lòng điều chỉnh lại số lượng.";
            }

            return Result<ReserveVariantResponse>.Success(response);
        }
        catch (Exception ex)
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            return Result<ReserveVariantResponse>.Failure($"Có lỗi xảy ra khi giữ tồn kho sản phẩm: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}