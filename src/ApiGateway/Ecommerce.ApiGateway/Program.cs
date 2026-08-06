using System.Net;
using System.Threading.RateLimiting;
using Ecommerce.ApiGateway.Consts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, cancellationToken) =>
    {
        // === BỔ SUNG CORS HEADERS CHO TRƯỜNG HỢP LỖI 429 ===
        var origin = context.HttpContext.Request.Headers["Origin"].ToString();
        
        // Danh sách các origin bạn cho phép (hoặc check đơn giản nếu nằm trong whitelist)
        var allowedOrigins = new[] { "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174" };
        
        if (!string.IsNullOrEmpty(origin) && allowedOrigins.Contains(origin))
        {
            context.HttpContext.Response.Headers["Access-Control-Allow-Origin"] = origin;
            context.HttpContext.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        }
        // ====================================================

        // Ép status code trả về là 429 Too Many Requests
        context.HttpContext.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
        
        // Cấu hình Header kiểu trả về là JSON
        context.HttpContext.Response.ContentType = "application/json";

        // Tạo cục Object lỗi theo format dự án của bạn
        var errorResponse = new
        {
            Success = false,
            StatusCode = 429,
            Message = "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau một phút!",
            Timestamp = DateTime.UtcNow
        };

        // Bắn cục JSON này về cho Client
        await context.HttpContext.Response.WriteAsJsonAsync(errorResponse, cancellationToken);
    };
});


builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
builder.Services.AddCors(options =>
{
    options.AddPolicy("MyPolicy", policy =>
    {
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",  "http://127.0.0.1:5174");
        policy.AllowCredentials(); // Bắt buộc khi Axios sử dụng withCredentials: true
    });
});

builder.Services.AddHttpClient(HttpClientConstansts.IdentityClientName, client =>
{
    client.BaseAddress = new Uri("http://localhost:5027");
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();
app.UseCors("MyPolicy");

app.UseRateLimiter();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapReverseProxy();


app.Run();