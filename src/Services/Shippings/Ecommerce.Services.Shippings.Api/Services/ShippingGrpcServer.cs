using System.Threading.Tasks;
using Grpc.Core;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Services;

public class ShippingGrpcServer(ShippingDbContext dbContext, ILogger<ShippingGrpcServer> logger) : ShippingGrpc.ShippingGrpcBase
{
    public override async Task<GetLocationNamesResponse> GetLocationNames(GetLocationNamesRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to resolve locations: ProvinceId: {ProvinceId}, DistrictId: {DistrictId}, WardCode: {WardCode}", 
            request.ProvinceId, request.DistrictId, request.WardCode);

        var provinceIdStr = request.ProvinceId.ToString();
        var districtIdStr = request.DistrictId.ToString();

        var locationInfo = await dbContext.Wards
            .Include(w => w.District)
                .ThenInclude(d => d.Province)
            .Where(w => w.Id == request.WardCode 
                     && w.DistrictId == districtIdStr 
                     && w.District.ProvinceId == provinceIdStr)
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
                request.ProvinceId, request.DistrictId, request.WardCode);
                
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
}
