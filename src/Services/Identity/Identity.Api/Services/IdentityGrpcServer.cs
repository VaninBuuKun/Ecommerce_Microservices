using System;
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
        logger.LogInformation("gRPC GetUserAddress: Truy vấn địa chỉ AddressId: {AddressId}, UserId: {UserId}", 
            request.AddressId, request.UserId);

        var result = await addressService.GetAddressByIdAsync(request.AddressId, request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetUserAddress: Không tìm thấy địa chỉ: AddressId: {AddressId}, UserId: {UserId}", 
                request.AddressId, request.UserId);
            return new GetUserAddressResponse { Found = false };
        }

        var address = result.Value;
        logger.LogInformation("gRPC GetUserAddress: Tìm thấy địa chỉ của người nhận '{RecipientName}'", address.RecipientName);
        return new GetUserAddressResponse
        {
            Found = true,
            RecipientName = address.RecipientName ?? string.Empty,
            Phone = address.Phone ?? string.Empty,
            ProvinceId = address.ProvinceId,
            DistrictId = address.DistrictId,
            WardId = address.WardId,
            AddressLine = address.AddressLine ?? string.Empty
        };
    }

    public override async Task<GetUserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC GetUser: Truy vấn thông tin người dùng UserId: {UserId}", request.UserId);

        var result = await userService.GetUserByIdAsync(request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetUser: Không tìm thấy người dùng UserId: {UserId}", request.UserId);
            return new GetUserResponse { Found = false };
        }

        var user = result.Value;
        logger.LogInformation("gRPC GetUser: Tìm thấy người dùng Email: '{Email}'", user.Email);
        return new GetUserResponse
        {
            Found = true,
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Phone = user.Phone ?? string.Empty,
            FirstName = user.FirstName ?? string.Empty,
            LastName = user.LastName ?? string.Empty,
            AvatarUrl = user.AvatarUrl ?? string.Empty
        };
    }
}
