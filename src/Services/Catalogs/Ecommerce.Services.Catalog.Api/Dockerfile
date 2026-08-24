# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/Services/Catalogs/Ecommerce.Services.Catalog.Api/Ecommerce.Services.Catalog.Api.csproj", "Services/Catalogs/Ecommerce.Services.Catalog.Api/"]
COPY ["src/Services/Catalogs/Ecommerce.Services.Catalog.Application/Ecommerce.Services.Catalog.Application.csproj", "Services/Catalogs/Ecommerce.Services.Catalog.Application/"]
COPY ["src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure/Ecommerce.Services.Catalog.Infrastructure.csproj", "Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure/"]
COPY ["src/Services/Catalogs/Ecommerce.Services.Catalog.Domain/Ecommerce.Services.Catalog.Domain.csproj", "Services/Catalogs/Ecommerce.Services.Catalog.Domain/"]
COPY ["src/Services/Catalogs/Ecommerce.Services.Catalog.Contracts/Ecommerce.Services.Catalog.Contracts.csproj", "Services/Catalogs/Ecommerce.Services.Catalog.Contracts/"]
COPY ["src/Services/Orders/Ecommerce.Services.Orders.Contracts/Ecommerce.Services.Orders.Contracts.csproj", "Services/Orders/Ecommerce.Services.Orders.Contracts/"]

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
RUN dotnet restore "Services/Catalogs/Ecommerce.Services.Catalog.Api/Ecommerce.Services.Catalog.Api.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/Services/Catalogs/Ecommerce.Services.Catalog.Api"
RUN dotnet publish "Ecommerce.Services.Catalog.Api.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Chạy app dưới quyền non-root user (bảo mật)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.Services.Catalog.Api.dll"]
