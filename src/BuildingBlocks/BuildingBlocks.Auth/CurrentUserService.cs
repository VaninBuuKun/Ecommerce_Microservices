using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Auth;

//IHttpContextAccessor sẽ giúp truy cập HttpContext ở bất ký đâu trong mã nguồn (bussiness, repo,...),
//Ở conteollerbase sẽ có sẵn đối tượng HttpContext rồi mà trong đó nó còn có field User nữa tương tương HttpContext.User
public class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    public long UserId
    {
        get 
        {
            var user = accessor.HttpContext?.User;
            if (user == null) return 0;

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
            if (userIdClaim == null) return 0;
            
            return long.TryParse(userIdClaim.Value, out var userId) ? userId : 0;
        }
    }

    public string? Email
    {
        get
        {
            var user = accessor.HttpContext?.User;
            if (user == null) return null;

            var emailClaim = user.FindFirst(ClaimTypes.Email) ?? user.FindFirst("email");
            return emailClaim?.Value;
        }
    }
    
    public bool IsAuthenticated => accessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
    public bool IsAdmin
    {
        get
        {
            var user = accessor.HttpContext?.User;
            if (user == null) return false;
            
            return user.IsInRole("Admin");
        }
    }
}