using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Web.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddBuildingBlocksWeb(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                // Định nghĩa Schema bảo mật Bearer Token
                var securityScheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Hãy nhập JWT Token của bạn vào đây (chỉ cần paste token, không cần gõ chữ Bearer)"
                };
                document.Components ??= new OpenApiComponents();
        
                // Thêm vào component của OpenAPI tài liệu
                document.Components.SecuritySchemes.Add("Bearer", securityScheme);
                // Áp dụng yêu cầu xác thực này cho toàn bộ các API trong tài liệu
                document.SecurityRequirements.Add(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
                return Task.CompletedTask;
            });
        });

        // Đọc cấu hình CORS và đăng ký
        var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>();
        
        // Nếu không có cấu hình ở appsettings.json, fallback về localhost port mặc định
        if (allowedOrigins == null || allowedOrigins.Length == 0)
        {
            allowedOrigins = new[] { "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5500" };
        }

        services.AddCors(options =>
        {
            options.AddPolicy("CorsPolicy", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        return services;
    }
}
