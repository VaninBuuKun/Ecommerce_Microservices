namespace Identity.Models.Dtos;

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Nickname { get; set; }
    public string? Gender { get; set; }
    public System.DateTime? BirthDate { get; set; }
}
