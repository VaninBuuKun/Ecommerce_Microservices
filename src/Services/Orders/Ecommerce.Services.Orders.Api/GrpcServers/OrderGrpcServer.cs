using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetCompletedSubOrderCountForProduct;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrderItemsForRebuy;
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
            logger.LogWarning("gRPC GetCompletedSubOrderCountForProduct received invalid identifiers: CustomerId={CustomerId}, ProductId={ProductId}", 
                request.CustomerId, request.ProductId);
            return new GetCompletedSubOrderCountForProductResponse { Count = 0 };
        }

        logger.LogInformation("gRPC GetCompletedSubOrderCountForProduct: Customer #{CustomerId}, Product #{ProductId}", 
            customerIdLong, productIdLong);

        var result = await sender.Send(new GetCompletedSubOrderCountForProductQuery(customerIdLong, productIdLong), context.CancellationToken);

        if (!result.IsSuccess)
        {
            logger.LogWarning("gRPC GetCompletedSubOrderCountForProduct failed: {Message}", result.Message);
            throw new RpcException(new Status(StatusCode.Internal, result.Message ?? "Lỗi truy vấn số lượng đơn hàng đã hoàn tất."));
        }

        logger.LogInformation("gRPC GetCompletedSubOrderCountForProduct: Result count {Count}", result.Value);
        return new GetCompletedSubOrderCountForProductResponse { Count = result.Value };
    }

    public override async Task<GetSubOrderItemsForRebuyResponse> GetSubOrderItemsForRebuy(
        GetSubOrderItemsForRebuyRequest request,
        ServerCallContext context)
    {
        logger.LogInformation("gRPC GetSubOrderItemsForRebuy: SubOrderId={SubOrderId}, CustomerId={CustomerId}",
            request.SubOrderId, request.CustomerId);

        var result = await sender.Send(
            new GetSubOrderItemsForRebuyQuery(request.SubOrderId, request.CustomerId), 
            context.CancellationToken);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetSubOrderItemsForRebuy failed: {Message}", result.Message);
            return new GetSubOrderItemsForRebuyResponse
            {
                IsSuccess = false,
                ErrorMessage = result.Message ?? "Không thể lấy thông tin đơn hàng."
            };
        }

        var response = new GetSubOrderItemsForRebuyResponse
        {
            IsSuccess = true
        };

        foreach (var item in result.Value)
        {
            response.Items.Add(new SubOrderItemRebuyDto
            {
                VariantId = item.VariantId,
                ProductId = item.ProductId,
                Quantity = item.Quantity
            });
        }

        return response;
    }
}
