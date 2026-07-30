using System.Threading.Tasks;
using Grpc.Core;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Services;

public class ShippingGrpcServer(
    ShippingDbContext dbContext, 
    GhnShippingProvider ghnShippingProvider,
    ILogger<ShippingGrpcServer> logger) : ShippingGrpc.ShippingGrpcBase
{
    public override async Task<GetLocationNamesResponse> GetLocationNames(GetLocationNamesRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to resolve locations: ProvinceId: {ProvinceId}, DistrictId: {DistrictId}, WardCode: {WardCode}", 
            request.ProvinceId, request.DistrictId, request.WardId);
        

        var locationInfo = await dbContext.Wards
            .Include(w => w.District)
                .ThenInclude(d => d.Province)
            .Where(w => w.Id == request.WardId 
                     && w.DistrictId == request.DistrictId 
                     && w.District.ProvinceId == request.ProvinceId)
            .Select(w => new
            {
                ProvinceName = w.District.Province.DisplayName ?? w.District.Province.Name,
                DistrictName = w.District.DisplayName ?? w.District.Name,
                WardName = w.DisplayName ?? w.Name
            })
            .FirstOrDefaultAsync(cancellationToken: context.CancellationToken);

        if (locationInfo == null)
        {
            logger.LogWarning("Failed to resolve location entities with single join query: ProvinceId: {P}, DistrictId: {D}, WardCode: {W}", 
                request.ProvinceId, request.DistrictId, request.WardId);
                
            return new GetLocationNamesResponse
            {
                IsValid = false,
                ProvinceName = string.Empty,
                DistrictName = string.Empty,
                WardName = string.Empty
            };
        }

        return new GetLocationNamesResponse
        {
            IsValid = true,
            ProvinceName = locationInfo.ProvinceName,
            DistrictName = locationInfo.DistrictName,
            WardName = locationInfo.WardName
        };
    }

    public override async Task<RegisterGhnShopResponse> RegisterGhnShop(RegisterGhnShopRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to register GHN shop: {Name}, Phone: {Phone}", request.Name, request.Phone);

        var result = await ghnShippingProvider.RegisterShopAsync(
            request.WardId,
            request.Name,
            request.Phone,
            request.Address,
            context.CancellationToken
        );

        if (result.IsSuccess)
        {
            return new RegisterGhnShopResponse
            {
                ShopId = result.Value,
                IsSuccess = true
            };
        }

        return new RegisterGhnShopResponse
        {
            IsSuccess = false,
            ErrorMessage = result.Message
        };
    }

    public override async Task<CalculateBatchFeeGrpcResponse> CalculateBatchFee(CalculateBatchFeeGrpcRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to calculate batch fee for {Count} requests", request.Requests.Count);

        var providerRequests = request.Requests.Select(req => new CalculateFeeRequest(
            req.GhnShopId,
            request.RecipientWardId,
            req.Weight,
            req.Length,
            req.Width,
            req.Height
        )).ToList();

        var batchResult = await ghnShippingProvider.CalculateBatchFeeAsync(providerRequests, context.CancellationToken);

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
