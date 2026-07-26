using System.Net;
using System.Threading.RateLimiting;
using Ecommerce.ApiGateway.Consts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    // 1. ĐỊNH NGHĨA PHẢN HỒI KHI VI PHẠM (CUSTOM REJECTION LOGIC)
    options.OnRejected = async (context, cancellationToken) =>
    {
        // Ép status code trả về là 429 Too Many Requests (Chuẩn REST API hơn là 503)
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

        // Bắn cục JSON này về cho Client (Postman/React)
        await context.HttpContext.Response.WriteAsJsonAsync(errorResponse, cancellationToken);
    };

    // 2. GIỮ NGUYÊN CHÍNH SÁCH FIXED WINDOW CỦA BẠN
    // options.AddPolicy("fixed-10-per-minute", httpContext =>
    //     RateLimitPartition.GetFixedWindowLimiter(
    //         partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
    //         factory: _ => new FixedWindowRateLimiterOptions
    //         {
    //             PermitLimit = 2,
    //             Window = TimeSpan.FromMinutes(1),
    //             QueueLimit = 0,
    //             AutoReplenishment = true
    //         }));
});
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
builder.Services.AddCors(options =>
{
    options.AddPolicy("MyPolicy", policy =>
    {
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",  "http://127.0.0.1:5174");
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