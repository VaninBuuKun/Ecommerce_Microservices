using System;
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
        logger.LogInformation("gRPC GetLocationNames: Tra cứu địa chỉ ProvinceId: {ProvinceId}, DistrictId: {DistrictId}, WardId: {WardId}", 
            request.ProvinceId, request.DistrictId, request.WardId);

        var result = await shippingAppService.GetLocationNamesAsync(request.ProvinceId, request.DistrictId, request.WardId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetLocationNames: Không tìm thấy địa danh: ProvinceId: {P}, DistrictId: {D}, WardId: {W}", 
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
            ProvinceName = loc.ProvinceName ?? string.Empty,
            DistrictName = loc.DistrictName ?? string.Empty,
            WardName = loc.WardName ?? string.Empty
        };
    }

    public override async Task<CalculateBatchFeeGrpcResponse> CalculateBatchFee(CalculateBatchFeeGrpcRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC CalculateBatchFee: Nhận yêu cầu tính phí vận chuyển cho {Count} shop, đến Ward #{RecipientWardId}", 
            request.Requests.Count, request.RecipientWardId);

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
                    logger.LogWarning("gRPC CalculateBatchFee: Shop #{ShopId} tính phí thất bại: {Message}", req.ShopId, result.Message);
                    response.Responses.Add(new CalculateFeeItemResponse
                    {
                        ShopId = req.ShopId,
                        IsSuccess = false,
                        ErrorMessage = result.Message ?? "Lỗi tính phí vận chuyển cho cửa hàng"
                    });
                }
            }
        }
        else
        {
            var errorMsg = batchResult?.Message ?? "Lỗi tính phí vận chuyển hàng loạt";
            logger.LogWarning("gRPC CalculateBatchFee thất bại hoàn toàn: {Message}", errorMsg);
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

        logger.LogInformation("gRPC CalculateBatchFee hoàn tất: Trả về {Count} kết quả phí vận chuyển", response.Responses.Count);
        return response;
    }
}
