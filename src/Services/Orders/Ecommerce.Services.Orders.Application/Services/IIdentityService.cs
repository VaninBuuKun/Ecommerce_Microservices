using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Users;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IIdentityService
{
    Task<Result<UserAddressDto>> GetUserAddressAsync(Guid addressId, long userId);
}
