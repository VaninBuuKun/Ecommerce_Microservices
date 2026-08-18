using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Identity.Api.Persistances;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Features.Queries.GetUserAddress;

public class GetUserAddressQueryHandler(AppDbContext dbContext) 
    : IRequestHandler<GetUserAddressQuery, Result<UserAddressDto>>
{
    public async Task<Result<UserAddressDto>> Handle(GetUserAddressQuery request, CancellationToken cancellationToken)
    {
        var address = await dbContext.UserAddresses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId, cancellationToken);

        if (address == null)
        {
            return Result<UserAddressDto>.Failure("Không tìm thấy địa chỉ giao hàng.", EErrorCode.NotFound);
        }

        var dto = new UserAddressDto(
            address.RecipientName,
            address.Phone,
            address.ProvinceId,
            address.DistrictId,
            address.WardId,
            address.AddressLine
        );

        return Result<UserAddressDto>.Success(dto);
    }
}
