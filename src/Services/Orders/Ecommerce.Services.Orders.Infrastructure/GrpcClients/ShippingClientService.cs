using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Shippings;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class ShippingClientService(ILogger<ShippingClientService> logger, ShippingGrpc.ShippingGrpcClient shippingClient) : IShippingService
{
    public async Task<Result<LocationDto>> GetLocationNameAsync(long provinceId, long districtId, long wardId)
    {
        try
        {
            var response = await shippingClient.GetLocationNamesAsync(new GetLocationNamesRequest
            {
                ProvinceId = provinceId,
                DistrictId = districtId,
                WardId = wardId
            });

            if (!response.IsValid)
            {
                return Result<LocationDto>.Failure($"Không tìm thấy địa điểm với mã {provinceId}-{districtId}-{wardId}",
                    EErrorCode.NotFound);
            }

            return Result<LocationDto>.Success(new LocationDto
            {
                ProvinceName = response.ProvinceName,
                DistrictName = response.DistrictName,
                WardName = response.WardName
            });
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi lấy địa tên địa điểm {provinceId}-{districtId}-{wardCode}", provinceId,
                districtId, wardId);
            return ex.ToResultFailure<LocationDto>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi lấy địa tên địa điểm {provinceId}-{districtId}-{wardCode}", provinceId,
                districtId, wardId);
            return Result<LocationDto>.Failure(
                $"Lỗi xảy ra khi lấy địa tên địa điểm {provinceId}-{districtId}-{wardId}",
                EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<List<ShippingFeeResponseItem>>> CalculateBatchShippingFeeAsync(List<ShippingFeeRequestItem> items, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new CalculateBatchFeeGrpcRequest
            {
                RecipientWardId = items.FirstOrDefault()?.RecipientWardId ?? 0
            };
            foreach (var item in items)
            {
                request.Requests.Add(new CalculateFeeItemRequest
                {
                    ShopId = item.ShopId,
                    Weight = item.Weight,
                    Length = item.Length,
                    Width = item.Width,
                    Height = item.Height,
                    SenderWardId = item.SenderWardId
                });
            }

            var response = await shippingClient.CalculateBatchFeeAsync(request, cancellationToken: cancellationToken);

            if (response == null || response.Responses == null)
            {
                return Result<List<ShippingFeeResponseItem>>.Failure("Không nhận được phản hồi tính phí vận chuyển từ hệ thống", EErrorCode.InternalServerError);
            }

            var results = response.Responses.Select(res => new ShippingFeeResponseItem(
                res.ShopId,
                res.IsSuccess,
                decimal.TryParse(res.Fee, out var fee) ? fee : 0,
                res.ErrorMessage
            )).ToList();

            return Result<List<ShippingFeeResponseItem>>.Success(results);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "gRPC error calculating batch shipping fee");
            return ex.ToResultFailure<List<ShippingFeeResponseItem>>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error calculating batch shipping fee");
            return Result<List<ShippingFeeResponseItem>>.Failure($"Lỗi hệ thống khi tính phí vận chuyển hàng loạt: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}