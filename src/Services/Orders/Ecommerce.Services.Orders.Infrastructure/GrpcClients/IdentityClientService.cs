using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class IdentityClientService(IdentityGrpc.IdentityGrpcClient client) : IIdentityService
{
    public async Task<Result<GetUserAddressResponse>> GetUserAddressAsync(Guid addressId, long userId)
    {
        try
        {
            var response = await client.GetUserAddressAsync(new GetUserAddressRequest
            {
                AddressId = addressId.ToString(),
                UserId = userId
            });

            if (!response.Found)
            {
                return Result<GetUserAddressResponse>.Failure("Địa chỉ giao hàng không tìm thấy hoặc không thuộc về người dùng này.", EErrorCode.NotFound);
            }

            return Result<GetUserAddressResponse>.Success(response);
        }
        catch (RpcException ex)
        {
            return Result<GetUserAddressResponse>.Failure($"gRPC Error calling Identity Service: {ex.Status.Detail}", EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            return Result<GetUserAddressResponse>.Failure($"Error getting user address: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
