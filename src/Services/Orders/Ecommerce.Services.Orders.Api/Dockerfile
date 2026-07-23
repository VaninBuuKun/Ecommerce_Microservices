# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Api/Ecommerce.Services.Orders.Api.csproj", "Services/Orders/Ecommerce.Services.Orders.Api/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Application/Ecommerce.Services.Orders.Application.csproj", "Services/Orders/Ecommerce.Services.Orders.Application/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Domain/Ecommerce.Services.Orders.Domain.csproj", "Services/Orders/Ecommerce.Services.Orders.Domain/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Contracts/Ecommerce.Services.Orders.Contracts.csproj", "Services/Orders/Ecommerce.Services.Orders.Contracts/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Infrastructure/Ecommerce.Services.Orders.Infrastructure.csproj", "Services/Orders/Ecommerce.Services.Orders.Infrastructure/"]

# Copy các ProjectReference từ BuildingBlocks
COPY ["src/BuildingBlocks/BuildingBlocks.Auth/BuildingBlocks.Auth.csproj", "BuildingBlocks/BuildingBlocks.Auth/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Grpc/BuildingBlocks.Grpc.csproj", "BuildingBlocks/BuildingBlocks.Grpc/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Logging/BuildingBlocks.Logging.csproj", "BuildingBlocks/BuildingBlocks.Logging/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "BuildingBlocks/BuildingBlocks.Web/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Application/BuildingBlocks.Application.csproj", "BuildingBlocks/BuildingBlocks.Application/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Shared/BuildingBlocks.Shared.csproj", "BuildingBlocks/BuildingBlocks.Shared/"]
COPY ["src/BuildingBlocks/BuildingBlocks.EfCore/BuildingBlocks.EfCore.csproj", "BuildingBlocks/BuildingBlocks.EfCore/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "BuildingBlocks/BuildingBlocks.Messaging/"]

# Restore các gói nuget
RUN dotnet restore "Services/Orders/Ecommerce.Services.Orders.Api/Ecommerce.Services.Orders.Api.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/Services/Orders/Ecommerce.Services.Orders.Api"
RUN dotnet publish "Ecommerce.Services.Orders.Api.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Chạy app dưới quyền non-root user (bảo mật)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.Services.Orders.Api.dll"]
