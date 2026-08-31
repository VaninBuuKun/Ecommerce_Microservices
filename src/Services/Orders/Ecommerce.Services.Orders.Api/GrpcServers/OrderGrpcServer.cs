using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetCompletedSubOrderCountForProduct;
using Grpc.Core;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Api.GrpcServers;

public class OrderGrpcServer(
    ISender sender,
    ILogger<OrderGrpcServer> logger) : OrderGrpc.OrderGrpcBase
{
    public override async Task<GetCompletedSubOrderCountForProductResponse> GetCompletedSubOrderCountForProduct(
        GetCompletedSubOrderCountForProductRequest request,
        ServerCallContext context)
    {
        if (!long.TryParse(request.CustomerId, out var customerIdLong) ||
            !long.TryParse(request.ProductId, out var productIdLong))
        {
            logger.LogWarning("gRPC GetCompletedSubOrderCountForProduct nhận định danh không hợp lệ: CustomerId={CustomerId}, ProductId={ProductId}", 
                request.CustomerId, request.ProductId);
            return new GetCompletedSubOrderCountForProductResponse { Count = 0 };
        }

        logger.LogInformation("gRPC GetCompletedSubOrderCountForProduct: Đếm đơn hàng hoàn tất cho Customer #{CustomerId}, Product #{ProductId}", 
            customerIdLong, productIdLong);

        var result = await sender.Send(new GetCompletedSubOrderCountForProductQuery(customerIdLong, productIdLong), context.CancellationToken);

        if (!result.IsSuccess)
        {
            logger.LogWarning("gRPC GetCompletedSubOrderCountForProduct thất bại: {Message}", result.Message);
            throw new RpcException(new Status(StatusCode.Internal, result.Message ?? "Lỗi truy vấn số lượng đơn hàng đã hoàn tất."));
        }

        logger.LogInformation("gRPC GetCompletedSubOrderCountForProduct: Kết quả {Count} đơn hàng", result.Value);
        return new GetCompletedSubOrderCountForProductResponse { Count = result.Value };
    }
}
