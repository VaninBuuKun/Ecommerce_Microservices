# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/Services/Sellers/Ecommerce.Services.Sellers.Api/Ecommerce.Services.Sellers.Api.csproj", "Services/Sellers/Ecommerce.Services.Sellers.Api/"]
COPY ["src/Services/Sellers/Ecommerce.Services.Sellers.Contracts/Ecommerce.Services.Sellers.Contracts.csproj", "Services/Sellers/Ecommerce.Services.Sellers.Contracts/"]

# Copy các ProjectReference từ BuildingBlocks
COPY ["src/BuildingBlocks/BuildingBlocks.Application/BuildingBlocks.Application.csproj", "BuildingBlocks/BuildingBlocks.Application/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Auth/BuildingBlocks.Auth.csproj", "BuildingBlocks/BuildingBlocks.Auth/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Caching/BuildingBlocks.Caching.csproj", "BuildingBlocks/BuildingBlocks.Caching/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Grpc/BuildingBlocks.Grpc.csproj", "BuildingBlocks/BuildingBlocks.Grpc/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Logging/BuildingBlocks.Logging.csproj", "BuildingBlocks/BuildingBlocks.Logging/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "BuildingBlocks/BuildingBlocks.Web/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Shared/BuildingBlocks.Shared.csproj", "BuildingBlocks/BuildingBlocks.Shared/"]
COPY ["src/BuildingBlocks/BuildingBlocks.EfCore/BuildingBlocks.EfCore.csproj", "BuildingBlocks/BuildingBlocks.EfCore/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "BuildingBlocks/BuildingBlocks.Messaging/"]

# Restore các gói nuget
RUN dotnet restore "Services/Sellers/Ecommerce.Services.Sellers.Api/Ecommerce.Services.Sellers.Api.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/Services/Sellers/Ecommerce.Services.Sellers.Api"
RUN dotnet publish "Ecommerce.Services.Sellers.Api.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Chạy app dưới quyền non-root user (bảo mật)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.Services.Sellers.Api.dll"]
