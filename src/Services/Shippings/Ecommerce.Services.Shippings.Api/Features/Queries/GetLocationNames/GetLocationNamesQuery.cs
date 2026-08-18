using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Shippings.Api.Features.Queries.GetLocationNames;

public record LocationNamesDto(string ProvinceName, string DistrictName, string WardName);

public record GetLocationNamesQuery(long ProvinceId, long DistrictId, long WardId) : IRequest<Result<LocationNamesDto>>;
