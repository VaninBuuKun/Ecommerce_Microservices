using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Identity.Api.Persistances;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Features.Queries.GetUserById;

public class GetUserByIdQueryHandler(AppDbContext dbContext) 
    : IRequestHandler<GetUserByIdQuery, Result<UserDetailDto>>
{
    public async Task<Result<UserDetailDto>> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Result<UserDetailDto>.Failure("Không tìm thấy người dùng.", EErrorCode.NotFound);
        }

        var dto = new UserDetailDto(
            user.Id,
            user.Email ?? string.Empty,
            user.PhoneNumber ?? string.Empty,
            user.FirstName ?? string.Empty,
            user.LastName ?? string.Empty,
            user.AvatarUrl ?? string.Empty
        );

        return Result<UserDetailDto>.Success(dto);
    }
}
