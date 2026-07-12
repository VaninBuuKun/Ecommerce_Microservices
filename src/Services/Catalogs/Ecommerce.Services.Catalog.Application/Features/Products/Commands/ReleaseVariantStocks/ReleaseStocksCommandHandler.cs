using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReleaseVariantStocks;

public class ReleaseStocksCommandHandler(IEfUnitOfWork unitOfWork, IVariantRepository variantRepository) : ICommandHandler<ReleaseStocksCommand>
{
    public async Task<Result> Handle(ReleaseStocksCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var variantIds = request.VariantStockDtos.Select(x => x.VariantId).ToList();
            var variants = await variantRepository.GetVariantsForUpdateAsync(variantIds, cancellationToken);
            
            var variantsDict = variants.ToDictionary(x => x.Id, x => x);

            foreach (var variantDto in request.VariantStockDtos)
            {
                if (variantsDict.TryGetValue(variantDto.VariantId, out var variant))
                {
                    variant.ReleaseStock(variantDto.Quantity);
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
