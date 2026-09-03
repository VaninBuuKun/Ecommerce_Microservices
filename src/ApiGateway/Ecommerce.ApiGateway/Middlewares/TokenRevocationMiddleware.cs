using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Ecommerce.ApiGateway.Middlewares;

/// <summary>
/// Middleware kiểm tra Token Blacklist / Revocation tại cửa ngõ API Gateway.
/// Nếu User đã đổi mật khẩu và token hiện tại được phát hành (iat) trước thời điểm đổi mật khẩu,
/// request sẽ bị chặn đứng ngay lập tức với mã lỗi 401 Unauthorized.
/// </summary>
public class TokenRevocationMiddleware(
    RequestDelegate next,
    ILogger<TokenRevocationMiddleware> logger)
{
    private static readonly JwtSecurityTokenHandler TokenHandler = new();

    public async Task InvokeAsync(HttpContext context, ICacheService cacheService)
    {
        var authHeader = context.Request.Headers["Authorization"].ToString();

        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var tokenString = authHeader.Substring("Bearer ".Length).Trim();
        if (string.IsNullOrWhiteSpace(tokenString))
        {
            await next(context);
            return;
        }

        try
        {
            if (TokenHandler.CanReadToken(tokenString))
            {
                var jwt = TokenHandler.ReadJwtToken(tokenString);

                var subClaim = jwt.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value;
                var iatClaim = jwt.Claims.FirstOrDefault(c => c.Type == "iat")?.Value;

                if (long.TryParse(subClaim, out var userId) && long.TryParse(iatClaim, out var iat))
                {
                    // Lấy thời điểm thu hồi phiên gần nhất của User từ Redis (O(1))
                    var revokedBefore = await cacheService.GetAsync<long>($"auth:revoked_before:{userId}", context.RequestAborted);

                    if (revokedBefore > 0 && iat < revokedBefore)
                    {
                        logger.LogWarning("Blocked request for User {UserId} with revoked token (iat: {Iat} < revoked: {RevokedBefore})",
                            userId, iat, revokedBefore);

                        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        context.Response.ContentType = "application/json";

                        var errorResponse = new
                        {
                            Success = false,
                            StatusCode = 401,
                            Message = "Phiên đăng nhập đã hết hạn do mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.",
                            Timestamp = DateTime.UtcNow
                        };

                        await context.Response.WriteAsJsonAsync(errorResponse, context.RequestAborted);
                        return;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // Bỏ qua lỗi parse để không làm gián đoạn các request thông thường, để downstream Auth validate
            logger.LogDebug(ex, "Token parsing skipped in TokenRevocationMiddleware");
        }

        await next(context);
    }
}
