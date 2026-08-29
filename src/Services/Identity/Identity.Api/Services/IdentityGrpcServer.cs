using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Identity.Api.Models.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Identity.Api.Services;

public class IdentityGrpcServer(
    IAddressService addressService,
    IUserService userService,
    ILogger<IdentityGrpcServer> logger) : IdentityGrpc.IdentityGrpcBase
{
    public override async Task<GetUserAddressResponse> GetUserAddress(GetUserAddressRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get user address: AddressId: {AddressId}, UserId: {UserId}", 
            request.AddressId, request.UserId);

        var result = await addressService.GetAddressByIdAsync(request.AddressId, request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("User address not found: AddressId: {AddressId}, UserId: {UserId}", request.AddressId, request.UserId);
            return new GetUserAddressResponse { Found = false };
        }

        var address = result.Value;
        return new GetUserAddressResponse
        {
            Found = true,
            RecipientName = address.RecipientName,
            Phone = address.Phone,
            ProvinceId = address.ProvinceId,
            DistrictId = address.DistrictId,
            WardId = address.WardId,
            AddressLine = address.AddressLine
        };
    }

    public override async Task<GetUserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get user details: UserId: {UserId}", request.UserId);

        var result = await userService.GetUserByIdAsync(request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("User not found: UserId: {UserId}", request.UserId);
            return new GetUserResponse { Found = false };
        }

        var user = result.Value;
        return new GetUserResponse
        {
            Found = true,
            Id = user.Id,
            Email = user.Email,
            Phone = user.Phone,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl
        };
    }
}
