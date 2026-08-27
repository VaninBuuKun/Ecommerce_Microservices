using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Users;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;
using MassTransit.Logging;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class IdentityClientService(IdentityGrpc.IdentityGrpcClient client, ILogger<IdentityClientService> logger) : IIdentityService
{
    public async Task<Result<UserAddressDto>> GetUserAddressAsync(long addressId, long userId)
    {
        try
        {
            var response = await client.GetUserAddressAsync(new GetUserAddressRequest
            {
                AddressId = addressId,
                UserId = userId
            });

            if (!response.Found)
            {
                return Result<UserAddressDto>.Failure("Địa chỉ giao hàng không tìm thấy hoặc không thuộc về người dùng này.", EErrorCode.NotFound);
            }

            return Result<UserAddressDto>.Success(new UserAddressDto()
            {
                Id = addressId.ToString(),
                UserId = userId,
                RecipientName = response.RecipientName,
                Phone = response.Phone,
                ProvinceId = response.ProvinceId,
                DistrictId = response.DistrictId,
                WardId = response.WardId,
                AddressLine = response.AddressLine,
            });
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Grpc Error getting user address");
            return ex.ToResultFailure<UserAddressDto>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error getting user address {addressId}");
            return Result<UserAddressDto>.Failure($"Error getting user address: {ex.Message}", EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<UserDetailDto>> GetUserAsync(long userId)
    {
        try
        {
            var response = await client.GetUserAsync(new GetUserRequest
            {
                UserId = userId
            });

            if (!response.Found)
            {
                return Result<UserDetailDto>.Failure("Người dùng không tồn tại.", EErrorCode.NotFound);
            }

            return Result<UserDetailDto>.Success(new UserDetailDto()
            {
                Id = response.Id,
                Email = response.Email,
                Phone = response.Phone,
                FirstName = response.FirstName,
                LastName = response.LastName,
                AvatarUrl = response.AvatarUrl
            });
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Grpc Error getting user details");
            return ex.ToResultFailure<UserDetailDto>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error getting user details for user {userId}");
            return Result<UserDetailDto>.Failure($"Error getting user: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
