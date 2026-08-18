using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface IIdentityService
{
    Task<Result<UserDetailDto>> GetUserAsync(long userId, CancellationToken cancellationToken = default);
}

public class UserDetailDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
}
