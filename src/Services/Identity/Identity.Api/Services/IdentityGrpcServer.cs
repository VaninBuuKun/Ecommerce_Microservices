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
}
