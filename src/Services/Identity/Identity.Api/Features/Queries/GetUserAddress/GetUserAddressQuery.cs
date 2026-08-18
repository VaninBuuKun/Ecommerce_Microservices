using System;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Identity.Api.Features.Queries.GetUserAddress;

public record UserAddressDto(
    string RecipientName,
    string Phone,
    long ProvinceId,
    long DistrictId,
    long WardId,
    string AddressLine
);

public record GetUserAddressQuery(Guid AddressId, long UserId) : IRequest<Result<UserAddressDto>>;
