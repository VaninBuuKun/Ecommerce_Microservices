namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Users;

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
