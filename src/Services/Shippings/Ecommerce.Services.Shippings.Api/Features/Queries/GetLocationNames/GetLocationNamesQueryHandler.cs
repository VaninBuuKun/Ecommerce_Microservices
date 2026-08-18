using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Shippings.Api.Persistances;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Shippings.Api.Features.Queries.GetLocationNames;

public class GetLocationNamesQueryHandler(ShippingDbContext dbContext) 
    : IRequestHandler<GetLocationNamesQuery, Result<LocationNamesDto>>
{
    public async Task<Result<LocationNamesDto>> Handle(GetLocationNamesQuery request, CancellationToken cancellationToken)
    {
        var locationInfo = await dbContext.Wards
            .AsNoTracking()
            .Include(w => w.District)
                .ThenInclude(d => d.Province)
            .Where(w => w.Id == request.WardId 
                     && w.DistrictId == request.DistrictId 
                     && w.District.ProvinceId == request.ProvinceId)
            .Select(w => new LocationNamesDto(
                w.District.Province.DisplayName ?? w.District.Province.Name,
                w.District.DisplayName ?? w.District.Name,
                w.DisplayName ?? w.Name
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (locationInfo == null)
        {
            return Result<LocationNamesDto>.Failure("Không tìm thấy thông tin địa danh.", EErrorCode.NotFound);
        }

        return Result<LocationNamesDto>.Success(locationInfo);
    }
}
