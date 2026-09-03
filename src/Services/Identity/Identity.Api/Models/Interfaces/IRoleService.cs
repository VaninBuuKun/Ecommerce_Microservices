using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Identity.Models.Dtos;

namespace Ecommerce.Services.Identity.Api.Models.Interfaces;

public interface IRoleService
{
    Task<Result<IEnumerable<RoleDto>>> GetRolesAsync();
    Task<Result> CreateRoleAsync(CreateRoleRequest request);
    Task<Result> UpdateRoleAsync(long id, UpdateRoleRequest request);
    Task<Result> DeleteRoleAsync(long id);
}
