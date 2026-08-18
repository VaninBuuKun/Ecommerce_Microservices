using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.GrpcClients;

public class IdentityClientService(
    IdentityGrpc.IdentityGrpcClient grpcClient,
    ILogger<IdentityClientService> logger)
    : IIdentityService
{
    public async Task<Result<UserDetailDto>> GetUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await grpcClient.GetUserAsync(new GetUserRequest
            {
                UserId = userId
            }, cancellationToken: cancellationToken);

            if (response == null || !response.Found)
            {
                logger.LogWarning("gRPC GetUser: User {UserId} not found in Identity service", userId);
                return Result<UserDetailDto>.Failure("Không tìm thấy thông tin người dùng", EErrorCode.NotFound);
            }

            return Result<UserDetailDto>.Success(new UserDetailDto
            {
                Id = response.Id,
                Email = response.Email,
                Phone = response.Phone,
                FirstName = response.FirstName,
                LastName = response.LastName,
                AvatarUrl = response.AvatarUrl
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "gRPC GetUser: Error calling Identity service for user {UserId}", userId);
            return Result<UserDetailDto>.Failure("Lỗi kết nối dịch vụ Identity", EErrorCode.InternalServerError);
        }
    }
}
