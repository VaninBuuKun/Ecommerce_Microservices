using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Ecommerce.Services.Notifications.Api.Services;

/// <summary>
/// Custom UserIdProvider cho SignalR Hub.
/// Trích xuất định danh UserId từ cả ClaimTypes.NameIdentifier và claim "sub" (OAuth2/OIDC).
/// </summary>
public class CustomUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? connection.User?.FindFirst("sub")?.Value;
    }
}
