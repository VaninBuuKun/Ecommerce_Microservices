using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Carts.Api.Models.Dtos;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Grpc.Core;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.GrpcClients;

public class ProductClientService(ILogger<ProductClientService> logger, ProductGrpc.ProductGrpcClient grpcClient, IMapper mapper) : IProductService
{
    public async Task<Result<ProductDto>> GetProductVariantAsync(long variantId)
    {
        try
        {
            var variant = await grpcClient.GetVariantByIdAsync(new GetVariantByIdRequest { Id = variantId });
            if (variant == null) 
            {
                return Result<ProductDto>.Failure("Product variant not found", EErrorCode.NotFound);
            }
            
            var productDto = mapper.Map<ProductDto>(variant);
            
            return Result<ProductDto>.Success(productDto);
        }
        catch (RpcException e)
        {
            return e.ToResultFailure<ProductDto>();
        }
    }

    public async Task<Result<List<ProductDto>>> GetProductVariantListAsync(List<long> variantIds, List<long> productIds)
    {
        try
        {
            var request = new GetVariantsByIdsRequest();
            request.VariantIds.AddRange(variantIds);
            request.ProductIds.AddRange(productIds);

            var variants = await grpcClient.GetVariantsByIdsAsync(request);
            
            if (variants == null) 
            {
                return Result<List<ProductDto>>.Failure("Product variants not found", EErrorCode.NotFound);
            }
            
            var productDtos = mapper.Map<List<ProductDto>>(variants.Variants);
            
            return Result<List<ProductDto>>.Success(productDtos);
        }
        catch (RpcException e)
        {
            return e.ToResultFailure<List<ProductDto>>();
        }
    }
}