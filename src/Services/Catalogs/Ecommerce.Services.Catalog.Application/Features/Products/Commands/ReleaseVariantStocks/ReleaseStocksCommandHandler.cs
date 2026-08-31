using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReleaseVariantStocks;

public class ReleaseStocksCommandHandler(IEfUnitOfWork unitOfWork, IVariantRepository variantRepository) : ICommandHandler<ReleaseStocksCommand>
{
    public async Task<Result> Handle(ReleaseStocksCommand request, CancellationToken cancellationToken)
    {
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

            foreach (var item in variantItems)
            {
                if (variantsDict.TryGetValue(item.VariantId, out var variant))
                {
                    variant.ReleaseStock(item.Quantity);
                }
            }

            foreach (var item in productItems)
            {
                if (productsDict.TryGetValue(item.ProductId, out var product))
                {
                    product.ReleaseStock(item.Quantity);
                    productRepo.Update(product);
                }
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
            await unitOfWork.CommitAsync(cancellationToken);
            
            return Result.Success();
        }
        catch (Exception ex)
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            return Result.Failure("Có lỗi xảy ra khi hoàn trả tồn kho: " + ex.Message);
        }
    }
}
