using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Identity.Api.Features.Queries.GetUserById;

public record UserDetailDto(
    long Id,
    string Email,
    string Phone,
    string FirstName,
    string LastName,
    string AvatarUrl
);

public record GetUserByIdQuery(long UserId) : IRequest<Result<UserDetailDto>>;
