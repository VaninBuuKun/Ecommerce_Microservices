# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/ApiGateway/Ecommerce.ApiGateway/Ecommerce.ApiGateway.csproj", "ApiGateway/Ecommerce.ApiGateway/"]

# Restore các gói nuget
RUN dotnet restore "ApiGateway/Ecommerce.ApiGateway/Ecommerce.ApiGateway.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/ApiGateway/Ecommerce.ApiGateway"
RUN dotnet publish "Ecommerce.ApiGateway.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Chạy app dưới quyền non-root user (bảo mật)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.ApiGateway.dll"]
