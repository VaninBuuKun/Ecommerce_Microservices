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
            var productItems = request.VariantStockDtos.Where(x => x.ProductId > 0 && x.VariantId <= 0).ToList();

            var variantIds = variantItems.Select(x => x.VariantId).Distinct().ToList();
            var variants = variantIds.Any()
                ? await variantRepository.GetVariantsForUpdateAsync(variantIds, cancellationToken)
                : new List<ProductVariant>();
            var variantsDict = variants.ToDictionary(x => x.Id, x => x);

            var productRepo = unitOfWork.Repository<Product, long>();
            var productIds = productItems.Select(x => x.ProductId).Distinct().ToList();
            var products = productIds.Any()
                ? await productRepo.GetAllAsync(p => productIds.Contains(p.Id), cancellationToken: cancellationToken)
                : new List<Product>();
            var productsDict = products.ToDictionary(p => p.Id, p => p);

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
                    AvailableStocks = variant.AvailableStocks,
                    ProductName = variant.Product?.Name ?? string.Empty,
                    VariantName = variant.GetVariantName() ?? string.Empty,
                    UnitPrice = variant.Price
                });

                if (item.Quantity > variant.AvailableStocks)
                {
                    response.IsSuccess = false;
                }
            }

            // 2. Kiểm tra tồn kho cho các Sản phẩm đơn
            foreach (var item in productItems)
            {
                if (!productsDict.TryGetValue(item.ProductId, out var product))
                {
                    await unitOfWork.RollbackAsync(cancellationToken);
                    return Result<ReserveVariantResponse>.Failure($"Không tìm thấy sản phẩm #{item.ProductId} trong hệ thống.", EErrorCode.NotFound);
                }

                response.VariantStocks.Add(new VariantStockInfo
                {
                    ShopId = product.ShopId,
                    VariantId = 0,
                    Quantity = item.Quantity,
                    AvailableStocks = product.AvailableStock,
                    ProductName = product.Name,
                    VariantName = string.Empty,
                    UnitPrice = product.DiscountPrice > 0 ? product.DiscountPrice : product.Price
                });

                if (item.Quantity > product.AvailableStock)
                {
                    response.IsSuccess = false;
                }
            }

            // 3. Thực hiện giữ kho nếu tất cả đều hợp lệ
            if (response.IsSuccess)
            {
                foreach (var item in variantItems)
                {
                    variantsDict[item.VariantId].ReserveStock(item.Quantity);
                }

                foreach (var item in productItems)
                {
                    var product = productsDict[item.ProductId];
                    product.ReserveStock(item.Quantity);
                    productRepo.Update(product);
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