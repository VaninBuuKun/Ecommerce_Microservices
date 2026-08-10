using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;
using Grpc.Core;
using MediatR;

namespace Ecommerce.Services.Catalog.Api.GrpcServers;

public class ProductGrpcService(ISender sender, ILogger<ProductGrpcService> logger) : ProductGrpc.ProductGrpcBase
{
    public override async Task<GetVariantByIdResponse> GetVariantById(GetVariantByIdRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.Id, out var variantId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid variant ID format"));
        } 
        logger.LogInformation($"Getting variant with variant ID {variantId}");
        var result = await sender.Send(new GetVariantByIdQuery(variantId));

        if (!result.IsSuccess)
        {
            throw result.ToRpcException();
        }
        
        var response = new GetVariantByIdResponse();
        var variant = result.Value;

        response.VariantId = variant.Id.ToString();
        response.AvailableStocks = variant.AvailableStocks;
        response.ShopId = variant.ShopId;

        return response;
    }
    
    //Hỗ trợ cho việc lấy full thông tin cho cart
    public override async Task<GetVariantsByIdsResponse> GetVariantsByIds(GetVariantsByIdsRequest request, ServerCallContext context)
    {
        var variantIds = request.VariantIds.Where(id => !string.IsNullOrEmpty(id)).Select(id => Guid.Parse(id)).ToList();
        var productIds = request.ProductIds.Where(id => !string.IsNullOrEmpty(id)).Select(id => Guid.Parse(id)).ToList();
        var result = await sender.Send(new GetVariantsByIdsQuery(variantIds, productIds));

        if (!result.IsSuccess)
        {
            throw result.ToRpcException();
        }
        
        var response = new GetVariantsByIdsResponse();

        var variants = result.Value;
        
        foreach (var variantDto in variants)
        {
            var variant = new RpcVariantDto();
            variant.UnitPrice = variantDto.Price.ToGrpcString();
            variant.ProductName = variantDto.ProductName;
            variant.ProductId = variantDto.ProductId.ToString();
            variant.AvailableStocks = variantDto.AvailableStocks;
            variant.VariantId = variantDto.Id.ToString();
            variant.VariantName = variantDto.VariantName;
            variant.ShopId = variantDto.ShopId;
            variant.Weight = variantDto.Weight;
            variant.Length = variantDto.Length;
            variant.Width = variantDto.Width;
            variant.Height = variantDto.Height;
            variant.ThumbnailUrl = variantDto.ThumbnailUrl ?? "";
            response.Variants.Add(variant);
        }
        return response;
    }

    public override async Task<ReserveStockResponse> ReserveStock(ReserveStockRequest request, ServerCallContext context)
    {
        logger.LogInformation("Nhận yêu cầu giữ kho gRPC cho {Count} sản phẩm", request.Items.Count);
        
        var variantDtos = request.Items.Select(x => new VariantStockDto
        {
            VariantId = Guid.Parse(x.VariantId),
            Quantity = x.Quantity
        }).ToList();
        
        var result = await sender.Send(new ReserveStocksCommand(variantDtos));
        
        if (!result.IsSuccess)
        {
            return new ReserveStockResponse
            {
                IsSuccess = false,
                ErrorMessage = result.Value.ErrorMessage
            };
        }
        
        var appResponse = result.Value;
        var response = new ReserveStockResponse
        {
            IsSuccess = appResponse.IsSuccess,
            ErrorMessage = appResponse.ErrorMessage
        };
        
        return response;
    }
}