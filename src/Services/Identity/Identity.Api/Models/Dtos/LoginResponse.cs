namespace Identity.Models.Dtos;

public class LoginResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AccessToken { get; set; }
    public int ExpiresIn { get; set; } // Số giây token còn hiệu lực
}
