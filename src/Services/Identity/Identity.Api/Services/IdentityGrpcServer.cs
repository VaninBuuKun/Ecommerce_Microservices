using System;
using System.Threading.Tasks;
using Grpc.Core;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Identity.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Identity.Api.Services;

public class IdentityGrpcServer(AppDbContext dbContext, ILogger<IdentityGrpcServer> logger) : IdentityGrpc.IdentityGrpcBase
{
    public override async Task<GetUserAddressResponse> GetUserAddress(GetUserAddressRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get user address: AddressId: {AddressId}, UserId: {UserId}", 
            request.AddressId, request.UserId);

        if (!Guid.TryParse(request.AddressId, out var addressId))
        {
            return new GetUserAddressResponse { Found = false };
        }

        var address = await dbContext.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == request.UserId);

        if (address == null)
        {
            logger.LogWarning("User address not found: AddressId: {AddressId}, UserId: {UserId}", 
                request.AddressId, request.UserId);
            return new GetUserAddressResponse { Found = false };
        }

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

        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user == null)
        {
            logger.LogWarning("User not found: UserId: {UserId}", request.UserId);
            return new GetUserResponse { Found = false };
        }

        return new GetUserResponse
        {
            Found = true,
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Phone = user.PhoneNumber ?? string.Empty,
            FirstName = user.FirstName ?? string.Empty,
            LastName = user.LastName ?? string.Empty,
            AvatarUrl = user.AvatarUrl ?? string.Empty
        };
    }
}
