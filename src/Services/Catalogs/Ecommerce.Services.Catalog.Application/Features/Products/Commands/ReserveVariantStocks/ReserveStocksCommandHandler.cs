using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;

public class ReserveStocksCommandHandler(IEfUnitOfWork unitOfWork, IVariantRepository variantRepository) : ICommandHandler<ReserveStocksCommand, ReserveVariantResponse >
{
    public async Task<Result<ReserveVariantResponse>> Handle(ReserveStocksCommand request, CancellationToken cancellationToken)
    {
        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var variantIds = request.VariantStockDtos.Select(x => x.VariantId).ToList();
            var variants = await variantRepository.GetVariantsForUpdateAsync(variantIds, cancellationToken);
            
            var variantsDict =  variants.ToDictionary(x => x.Id, x => x);

            var response = new ReserveVariantResponse();

            foreach (var variantDto in request.VariantStockDtos)
            {
                var variant = variantsDict[variantDto.VariantId];

                var newVariantStockInfo = new VariantStockInfo
                {
                    VariantId = variant.Id,
                    Quantity = variantDto.Quantity,
                    AvailableStocks = variant.AvailableStocks,
                    ProductName = variant.Product?.Name ?? string.Empty,
                    VariantName = variant.GetVariantName() ?? string.Empty,
                    UnitPrice = variant.Price
                };
                
                response.VariantStocks.Add(newVariantStockInfo);

                if (variantDto.Quantity > variant.AvailableStocks)
                {
                    response.IsSuccess = false;
                }
            }

            if (response.IsSuccess)
            {
                foreach (var variantDto in request.VariantStockDtos)
                {
                    var variant = variantsDict[variantDto.VariantId];

                    variant.ReserveStock(variantDto.Quantity);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
                await unitOfWork.CommitAsync(cancellationToken);
            }
            return Result<ReserveVariantResponse>.Success(response);
        }
        catch (Exception ex)
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            return Result<ReserveVariantResponse>.ValidationFailure("Có lỗi xảy ra khi đặt hàng");
        }
    }
}