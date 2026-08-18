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
            !Guid.TryParse(request.ProductId, out var productIdGuid))
        {
            return new GetCompletedSubOrderCountForProductResponse { Count = 0 };
        }

        logger.LogInformation("OrderGrpcServer: Nhận yêu cầu đếm đơn hàng cho Customer {CustomerId}, Product {ProductId}", customerIdLong, productIdGuid);

        var result = await sender.Send(new GetCompletedSubOrderCountForProductQuery(customerIdLong, productIdGuid), context.CancellationToken);

        if (!result.IsSuccess)
        {
            logger.LogWarning("OrderGrpcServer: Đếm đơn hàng thất bại: {Message}", result.Message);
            throw new RpcException(new Status(StatusCode.Internal, result.Message ?? "Lỗi truy vấn số lượng đơn hàng"));
        }

        return new GetCompletedSubOrderCountForProductResponse { Count = result.Value };
    }
}
