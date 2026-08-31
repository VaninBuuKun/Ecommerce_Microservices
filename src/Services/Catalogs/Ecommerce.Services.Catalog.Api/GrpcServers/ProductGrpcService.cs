using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;
using Grpc.Core;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Api.GrpcServers;

public class ProductGrpcService(ISender sender, ILogger<ProductGrpcService> logger) : ProductGrpc.ProductGrpcBase
{
    public override async Task<GetVariantByIdResponse> GetVariantById(GetVariantByIdRequest request, ServerCallContext context)
    {
        if (request.Id <= 0)
        {
            logger.LogWarning("gRPC GetVariantById nhận ID không hợp lệ: {Id}", request.Id);
            throw new RpcException(new Status(StatusCode.InvalidArgument, $"Mã phân loại biến thể không hợp lệ: {request.Id}"));
        }

        logger.LogInformation("gRPC GetVariantById: Truy vấn thông tin biến thể #{VariantId}", request.Id);
        var result = await sender.Send(new GetVariantByIdQuery(request.Id), context.CancellationToken);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetVariantById: Không tìm thấy biến thể #{VariantId}: {Message}", request.Id, result.Message);
            throw result.ToRpcException();
        }
        
        var variant = result.Value;
        var response = new GetVariantByIdResponse
        {
            VariantId = variant.Id,
            ProductId = variant.ProductId != 0 ? variant.ProductId : variant.Id,
            AvailableStocks = variant.AvailableStocks,
            ShopId = variant.ShopId
        };

        return response;
    }
    
    public override async Task<GetVariantsByIdsResponse> GetVariantsByIds(GetVariantsByIdsRequest request, ServerCallContext context)
    {
        var variantIds = request.VariantIds.ToList();
        var productIds = request.ProductIds.ToList();
        logger.LogInformation("gRPC GetVariantsByIds: Truy vấn danh sách {VariantCount} biến thể và {ProductCount} sản phẩm",
            variantIds.Count, productIds.Count);

        var result = await sender.Send(new GetVariantsByIdsQuery(variantIds, productIds), context.CancellationToken);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetVariantsByIds thất bại: {Message}", result.Message);
            throw result.ToRpcException();
        }
        
        var response = new GetVariantsByIdsResponse();
        var variants = result.Value;
        
        foreach (var variantDto in variants)
        {
            var variant = new RpcVariantDto
            {
                UnitPrice = variantDto.Price.ToGrpcString(),
                DiscountPrice = variantDto.DiscountPrice.ToGrpcString(),
                ProductName = variantDto.ProductName ?? string.Empty,
                ProductId = variantDto.ProductId,
                AvailableStocks = variantDto.AvailableStocks,
                VariantId = variantDto.Id,
                VariantName = variantDto.VariantName ?? string.Empty,
                ShopId = variantDto.ShopId,
                Weight = variantDto.Weight,
                Length = variantDto.Length,
                Width = variantDto.Width,
                Height = variantDto.Height,
                ThumbnailUrl = variantDto.ThumbnailUrl ?? string.Empty
            };
            response.Variants.Add(variant);
        }

        logger.LogInformation("gRPC GetVariantsByIds: Trả về thành công {Count} biến thể", response.Variants.Count);
        return response;
    }

    public override async Task<ReserveStockResponse> ReserveStock(ReserveStockRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC ReserveStock: Nhận yêu cầu giữ kho cho {Count} mặt hàng", request.Items.Count);
        
        var variantDtos = request.Items.Select(x => new VariantStockDto
        {
            ProductId = x.ProductId,
            VariantId = x.VariantId,
            Quantity = x.Quantity
        }).ToList();
        
        var result = await sender.Send(new ReserveStocksCommand(variantDtos), context.CancellationToken);
        
        if (!result.IsSuccess || result.Value == null)
        {
            var errorMsg = result.Message ?? "Không thể giữ tồn kho sản phẩm.";
            logger.LogWarning("gRPC ReserveStock thất bại: {Message}", errorMsg);
            return new ReserveStockResponse
            {
                IsSuccess = false,
                ErrorMessage = errorMsg
            };
        }
        
        var appResponse = result.Value;
        logger.LogInformation("gRPC ReserveStock hoàn tất: IsSuccess={IsSuccess}, ErrorMessage={ErrorMessage}", 
            appResponse.IsSuccess, appResponse.ErrorMessage);

        return new ReserveStockResponse
        {
            IsSuccess = appResponse.IsSuccess,
            ErrorMessage = appResponse.ErrorMessage ?? string.Empty
        };
    }
}