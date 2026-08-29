using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;

using Ecommerce.Services.Sellers.Api.Models.Interfaces;

namespace Ecommerce.Services.Sellers.Api.Services;

public class ShippingService(ShippingGrpc.ShippingGrpcClient shippingGrpcClient) : IShippingService
{
    public async Task<Result<LocationNamesDto>> GetLocationNamesAsync(
        long provinceId, long districtId, long wardId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await shippingGrpcClient.GetLocationNamesAsync(new GetLocationNamesRequest
            {
                ProvinceId = provinceId,
                DistrictId = districtId,
                WardId = wardId
            }, cancellationToken: cancellationToken);

            if (response != null && response.IsValid)
            {
                var dto = new LocationNamesDto(response.ProvinceName, response.DistrictName, response.WardName);
                return Result<LocationNamesDto>.Success(dto);
            }

            return Result<LocationNamesDto>.Failure("Địa giới hành chính không hợp lệ.", EErrorCode.InvalidArgument);
        }
        catch (Exception ex)
        {
            return Result<LocationNamesDto>.Failure($"Lỗi kết nối kiểm tra địa chỉ: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
