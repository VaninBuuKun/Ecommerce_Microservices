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
    public async Task<Result<int>> GetCompletedSubOrderCountForProductAsync(long customerId, long productId, CancellationToken cancellationToken = default)
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

    public async Task<Result<bool>> CheckProductHasActiveSubOrdersAsync(long productId, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("Calling gRPC CheckProductHasActiveSubOrders for ProductId: {ProductId}", productId);

            var response = await grpcClient.CheckProductHasActiveSubOrdersAsync(
                new CheckProductHasActiveSubOrdersRequest
                {
                    ProductId = productId
                },
                cancellationToken: cancellationToken);

            return Result<bool>.Success(response.HasActiveSubOrders);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi kiểm tra đơn hàng đang hoạt động của ProductId {ProductId}: {Message}", 
                productId, ex.Message);
            return ex.ToResultFailure<bool>();
        }
    }

    public async Task<Result<(bool HasAnyOrders, bool HasActiveOrders)>> CheckVariantOrdersAsync(long variantId, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("Calling gRPC CheckVariantOrders for VariantId: {VariantId}", variantId);

            var response = await grpcClient.CheckVariantOrdersAsync(
                new CheckVariantOrdersRequest
                {
                    VariantId = variantId
                },
                cancellationToken: cancellationToken);

            return Result<(bool HasAnyOrders, bool HasActiveOrders)>.Success((response.HasAnyOrders, response.HasActiveOrders));
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi kiểm tra đơn hàng của VariantId {VariantId}: {Message}", 
                variantId, ex.Message);
            return ex.ToResultFailure<(bool HasAnyOrders, bool HasActiveOrders)>();
        }
    }
}
