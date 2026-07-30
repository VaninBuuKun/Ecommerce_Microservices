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

        var tasks = request.Requests.Select(async req =>
        {
            var result = await ghnShippingProvider.CalculateFeeAsync(new CalculateFeeRequest(
                req.SenderWardId,
                req.RecipientWardId,
                req.Weight,
                req.Length,
                req.Width,
                req.Height
            ), context.CancellationToken);

            if (result.IsSuccess)
            {
                return new CalculateFeeItemResponse
                {
                    ShopId = req.ShopId,
                    IsSuccess = true,
                    Fee = result.Value.ToString()
                };
            }

            return new CalculateFeeItemResponse
            {
                ShopId = req.ShopId,
                IsSuccess = false,
                ErrorMessage = result.Message
            };
        }).ToList();

        var results = await Task.WhenAll(tasks);

        var response = new CalculateBatchFeeGrpcResponse();
        response.Responses.AddRange(results);

        return response;
    }
}
