using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Services;

public class ShippingGrpcServer(
    IShippingAppService shippingAppService,
    ILogger<ShippingGrpcServer> logger) : ShippingGrpc.ShippingGrpcBase
{
    public override async Task<GetLocationNamesResponse> GetLocationNames(GetLocationNamesRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to resolve locations: ProvinceId: {ProvinceId}, DistrictId: {DistrictId}, WardCode: {WardCode}", 
            request.ProvinceId, request.DistrictId, request.WardId);

        var result = await shippingAppService.GetLocationNamesAsync(request.ProvinceId, request.DistrictId, request.WardId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("Failed to resolve location entities: ProvinceId: {P}, DistrictId: {D}, WardCode: {W}", 
                request.ProvinceId, request.DistrictId, request.WardId);
                
            return new GetLocationNamesResponse
            {
                IsValid = false,
                ProvinceName = string.Empty,
                DistrictName = string.Empty,
                WardName = string.Empty
            };
        }

        var loc = result.Value;
        return new GetLocationNamesResponse
        {
            IsValid = true,
            ProvinceName = loc.ProvinceName,
            DistrictName = loc.DistrictName,
            WardName = loc.WardName
        };
    }

    public override async Task<CalculateBatchFeeGrpcResponse> CalculateBatchFee(CalculateBatchFeeGrpcRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to calculate batch fee for {Count} requests", request.Requests.Count);

        var feeRequests = request.Requests.Select(req => new CalculateFeeRequest(
            req.SenderWardId,
            request.RecipientWardId,
            req.Weight,
            req.Length,
            req.Width,
            req.Height
        )).ToList();

        var batchResult = await shippingAppService.CalculateBatchFeeAsync(feeRequests, context.CancellationToken);

        var response = new CalculateBatchFeeGrpcResponse();

        if (batchResult.IsSuccess && batchResult.Value != null)
        {
            for (int i = 0; i < request.Requests.Count; i++)
            {
                var req = request.Requests[i];
                var result = batchResult.Value[i];

                if (result.IsSuccess)
                {
                    response.Responses.Add(new CalculateFeeItemResponse
                    {
                        ShopId = req.ShopId,
                        IsSuccess = true,
                        Fee = result.Value.ToString()
                    });
                }
                else
                {
                    response.Responses.Add(new CalculateFeeItemResponse
                    {
                        ShopId = req.ShopId,
                        IsSuccess = false,
                        ErrorMessage = result.Message
                    });
                }
            }
        }
        else
        {
            var errorMsg = batchResult?.Message ?? "Lỗi tính phí vận chuyển hàng loạt";
            foreach (var req in request.Requests)
            {
                response.Responses.Add(new CalculateFeeItemResponse
                {
                    ShopId = req.ShopId,
                    IsSuccess = false,
                    ErrorMessage = errorMsg
                });
            }
        }

        return response;
    }
}
