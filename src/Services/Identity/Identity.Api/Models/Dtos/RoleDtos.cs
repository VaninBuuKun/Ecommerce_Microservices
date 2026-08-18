using System.ComponentModel.DataAnnotations;

namespace Identity.Models.Dtos;

public class CreateRoleRequest
{
    [Required(ErrorMessage = "Tên vai trò là bắt buộc.")]
    public string RoleName { get; set; } = string.Empty;
}

public class UpdateRoleRequest
{
    [Required(ErrorMessage = "Tên vai trò mới là bắt buộc.")]
    public string NewRoleName { get; set; } = string.Empty;
}

public class RoleDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int UserCount { get; set; }
}
