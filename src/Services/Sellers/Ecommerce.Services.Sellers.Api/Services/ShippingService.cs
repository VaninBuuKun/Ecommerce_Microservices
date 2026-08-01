using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;

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

    public async Task<Result<GhnShopRegistrationDto>> RegisterGhnShopAsync(
        long wardId, string name, string phone, string address, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await shippingGrpcClient.RegisterGhnShopAsync(new RegisterGhnShopRequest
            {
                WardId = wardId,
                Name = name,
                Phone = phone,
                Address = address
            }, cancellationToken: cancellationToken);

            if (response != null && response.IsSuccess)
            {
                var dto = new GhnShopRegistrationDto(response.ShopId);
                return Result<GhnShopRegistrationDto>.Success(dto);
            }

            var errMsg = response?.ErrorMessage ?? "Lỗi không xác định từ đối tác vận chuyển.";
            return Result<GhnShopRegistrationDto>.Failure(errMsg, EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            return Result<GhnShopRegistrationDto>.Failure($"Lỗi kết nối đăng ký shop: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
