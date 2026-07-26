using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Grpc.Services;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IIdentityService
{
    Task<Result<GetUserAddressResponse>> GetUserAddressAsync(Guid addressId, long userId);
}
