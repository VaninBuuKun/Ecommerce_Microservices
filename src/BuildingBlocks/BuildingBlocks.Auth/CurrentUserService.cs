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
            var userIdClaim = accessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value;
            
            return long.TryParse(userIdClaim, out var userId) ? userId : throw new InvalidOperationException("UserId claim is not a valid long value.");
        }
    }

    public string? Email
    {
        get
        {
            var email = accessor.HttpContext.User.FindFirst(ClaimTypes.Email).Value;

            return email;
        }
    }
    
    public bool IsAuthenticated => accessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}