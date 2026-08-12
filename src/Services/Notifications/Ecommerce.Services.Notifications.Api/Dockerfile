# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/Services/Notifications/Ecommerce.Services.Notifications.Api/Ecommerce.Services.Notifications.Api.csproj", "Services/Notifications/Ecommerce.Services.Notifications.Api/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Contracts/Ecommerce.Services.Orders.Contracts.csproj", "Services/Orders/Ecommerce.Services.Orders.Contracts/"]

# Copy các ProjectReference từ BuildingBlocks
COPY ["src/BuildingBlocks/BuildingBlocks.Auth/BuildingBlocks.Auth.csproj", "BuildingBlocks/BuildingBlocks.Auth/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Logging/BuildingBlocks.Logging.csproj", "BuildingBlocks/BuildingBlocks.Logging/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "BuildingBlocks/BuildingBlocks.Web/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Application/BuildingBlocks.Application.csproj", "BuildingBlocks/BuildingBlocks.Application/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Shared/BuildingBlocks.Shared.csproj", "BuildingBlocks/BuildingBlocks.Shared/"]
COPY ["src/BuildingBlocks/BuildingBlocks.EfCore/BuildingBlocks.EfCore.csproj", "BuildingBlocks/BuildingBlocks.EfCore/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "BuildingBlocks/BuildingBlocks.Messaging/"]

# Restore các gói nuget
RUN dotnet restore "Services/Notifications/Ecommerce.Services.Notifications.Api/Ecommerce.Services.Notifications.Api.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/Services/Notifications/Ecommerce.Services.Notifications.Api"
RUN dotnet publish "Ecommerce.Services.Notifications.Api.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080

# Chạy app dưới quyền non-root user (bảo mật)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.Services.Notifications.Api.dll"]
