using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.GrpcClients;

public class OrderClientService(
    OrderGrpc.OrderGrpcClient grpcClient,
    ILogger<OrderClientService> logger)
    : IOrderService
{
    public async Task<Result<int>> GetCompletedSubOrderCountForProductAsync(long customerId, Guid productId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await grpcClient.GetCompletedSubOrderCountForProductAsync(
                new GetCompletedSubOrderCountForProductRequest
                {
                    CustomerId = customerId.ToString(),
                    ProductId = productId.ToString()
                },
                cancellationToken: cancellationToken);

            return Result<int>.Success(response.Count);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi đếm số đơn hàng hoàn tất của CustomerId {CustomerId} cho ProductId {ProductId}: {Message}", 
                customerId, productId, ex.Message);
            return ex.ToResultFailure<int>();
        }
    }
}
