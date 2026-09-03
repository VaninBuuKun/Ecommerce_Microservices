using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.GrpcClients;

public class OrderClientService(
    OrderGrpc.OrderGrpcClient grpcClient,
    ILogger<OrderClientService> logger) : IOrderService
{
    public async Task<Result<List<SubOrderItemRebuyItem>>> GetSubOrderItemsForRebuyAsync(long subOrderId, long customerId)
    {
        try
        {
            var request = new GetSubOrderItemsForRebuyRequest
            {
                SubOrderId = subOrderId,
                CustomerId = customerId
            };

            var response = await grpcClient.GetSubOrderItemsForRebuyAsync(request);

            if (!response.IsSuccess)
            {
                logger.LogWarning("gRPC GetSubOrderItemsForRebuy failed: {ErrorMessage}", response.ErrorMessage);
                return Result<List<SubOrderItemRebuyItem>>.Failure(
                    response.ErrorMessage ?? "Không thể lấy thông tin đơn hàng.",
                    EErrorCode.NotFound);
            }

            var items = response.Items
                .Select(i => new SubOrderItemRebuyItem(i.VariantId, i.ProductId, i.Quantity))
                .ToList();

            return Result<List<SubOrderItemRebuyItem>>.Success(items);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "gRPC error when querying sub-order items for rebuy: {Message}", ex.Message);
            return ex.ToResultFailure<List<SubOrderItemRebuyItem>>();
        }
    }
}
