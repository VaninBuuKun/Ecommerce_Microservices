using System.Text.Json;
using Ecommerce.ApiGateway.Consts;
using Ecommerce.ApiGateway.Dtos;
using Microsoft.AspNetCore.Mvc;
using LoginRequest = Ecommerce.ApiGateway.Dtos.LoginRequest;

namespace Ecommerce.ApiGateway.Controllers;

[ApiController]
[Route("api/app-auth")]
public class AuthController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var client = httpClientFactory.CreateClient(HttpClientConstansts.IdentityClientName);

        var userAgent = Request.Headers["User-Agent"].ToString();
        var clientIp = Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                       ?? HttpContext.Connection.RemoteIpAddress?.ToString() 
                       ?? "127.0.0.1";
        var acceptLanguage = Request.Headers["Accept-Language"].ToString();

        var body = new Dictionary<string, string>()
        {
            {"grant_type","password" },
            {"client_id", "api-client" },
            {"username", request.Username},
            {"password", request.Password },
            { "scope", "openid profile offline_access catalog cart order IdentityServerApi" } 
        };
        
        var encodedContext = new FormUrlEncodedContent(body);
        
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/connect/token")
        {
            Content = encodedContext
        };

        if (!string.IsNullOrWhiteSpace(userAgent))
            httpRequest.Headers.TryAddWithoutValidation("User-Agent", userAgent);

        httpRequest.Headers.TryAddWithoutValidation("X-Forwarded-For", clientIp);

        if (!string.IsNullOrWhiteSpace(acceptLanguage))
            httpRequest.Headers.TryAddWithoutValidation("Accept-Language", acceptLanguage);

        var respone = await client.SendAsync(httpRequest);

        if (!respone.IsSuccessStatusCode)
        {
            var errorContent = await respone.Content.ReadAsStringAsync();

            // 1. Kiểm tra LỖI BỊ VÔ HIỆU HÓA BỞI ADMIN
            if (errorContent.Contains("account_disabled") || errorContent.Contains("disabled"))
            {
                return BadRequest("Tài khoản của bạn đã bị quản trị viên khóa/vô hiệu hóa. Vui lòng liên hệ hỗ trợ!");
            }

            // 2. Kiểm tra LỖI BỊ KHÓA TẠM THỜI DO NHẬP SAI NHIỀU LẦN
            if (errorContent.Contains("account_locked") || errorContent.Contains("locked") || errorContent.Contains("lockout"))
            {
                return BadRequest("Tài khoản đã bị tạm khóa 5 phút do nhập sai mật khẩu nhiều lần!");
            }

            // 3. Kiểm tra LỖI SAI TÀI KHOẢN / MẬT KHẨU (Trả về thông tin tài khoản và mật khẩu không chính xác)
            if (errorContent.Contains("invalid_credentials") || errorContent.Contains("invalid_grant"))
            {
                return BadRequest("Thông tin tài khoản và mật khẩu không chính xác!");
            }

            return BadRequest("Thông tin tài khoản và mật khẩu không chính xác!");
        }
        var tokenResponse = await respone.Content.ReadFromJsonAsync<TokenResponse>();

        Response.Cookies.Append("refresh_token", tokenResponse!.RefreshToken ,new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax, //từ domain khác vào domain mình thì k gửi kèm cookie(các top level navigation(mở thẳng trang ms trong tab hiện tại) thư search google, email... thì được).
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new LoginResponse()
        {
            AccessToken = tokenResponse.AccessToken,
        });
    }
    
    [HttpPost("refresh")]
public async Task<IActionResult> Refresh()
{
    // 1. Lấy refresh_token từ Cookie gửi kèm trong Request
    if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrEmpty(refreshToken))
    {
        return Unauthorized("Không tìm thấy Refresh Token. Vui lòng đăng nhập lại!");
    }

    var client = httpClientFactory.CreateClient(HttpClientConstansts.IdentityClientName);
    
    
    var body = new Dictionary<string, string>
    {
        { "grant_type", "refresh_token" },
        { "client_id", "api-client" },
        { "refresh_token", refreshToken }
    };

    var encodedContext = new FormUrlEncodedContent(body);

    // 3. Gửi Request sang IdentityServer
    var response = await client.PostAsync("/connect/token", encodedContext);

    if (!response.IsSuccessStatusCode)
    {
        Response.Cookies.Delete("refresh_token");
        return Unauthorized("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
    }

    // 4. Giải mã dữ liệu trả về (sử dụng chung class TokenResponse đã sửa JsonPropertyName)
    var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>();

    if (tokenResponse == null)
    {
        return BadRequest("Không thể nhận diện Token phản hồi từ hệ thống xác thực.");
    }

    // 5. Ghi đè Refresh Token MỚI nhận được vào Cookie (xoay vòng token)
    if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
    {
        Response.Cookies.Append("refresh_token", tokenResponse.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Set true trên Production khi chạy HTTPS
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    // 6. Trả Access Token mới về cho Frontend
    return Ok(new LoginResponse
    {
        AccessToken = tokenResponse.AccessToken
    });
}

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("refresh_token", out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
        {
            try
            {
                var client = httpClientFactory.CreateClient(HttpClientConstansts.IdentityClientName);
                var body = new Dictionary<string, string>
                {
                    { "client_id", "api-client" },
                    { "token", refreshToken },
                    { "token_type_hint", "refresh_token" }
                };
                var encodedContext = new FormUrlEncodedContent(body);
                await client.PostAsync("/connect/revocation", encodedContext);
            }
            catch
            {
                // Ignore and proceed to delete cookie
            }
        }

        Response.Cookies.Delete("refresh_token", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax
        });

        return NoContent();
    }
}

