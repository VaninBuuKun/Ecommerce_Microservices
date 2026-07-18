using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class ProductClientService(ProductGrpc.ProductGrpcClient client) : IProductService
{
    public async Task<Result<ReserveStockResponseDto>> ReserveStockAsync(List<ReserveStockItemDto> items, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new ReserveStockRequest();
            foreach (var item in items)
            {
                request.Items.Add(new RpcReserveStockItemDto()
                {
                    VariantId = item.VariantId.ToString(),
                    Quantity = item.Quantity
                });
            }

            var response = await client.ReserveStockAsync(request, cancellationToken: cancellationToken);

            var itemDetails = response.Items.Select(x => new ReservedStockItemDetailDto(
                x.ShopId,
                Guid.Parse(x.VariantId),
                x.Quantity,
                x.AvailableStocks,
                x.ProductName,
                x.VariantName,
                x.UnitPrice.FromGrpcString()
            )).ToList();

            var responseDto = new ReserveStockResponseDto(
                response.IsSuccess,
                itemDetails,
                response.ErrorMessage
            );

            return Result<ReserveStockResponseDto>.Success(responseDto);
        }
        catch (RpcException ex)
        {
            return ex.ToResultFailure<ReserveStockResponseDto>();
        }
        catch (Exception ex)
        {
            return Result<ReserveStockResponseDto>.Failure($"Error reserving stock: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
