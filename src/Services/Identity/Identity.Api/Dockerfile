# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy các file .csproj cần thiết để restore dependencies
COPY ["src/Services/Identity/Identity.Api/Identity.Api.csproj", "Services/Identity/Identity.Api/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Application/BuildingBlocks.Application.csproj", "BuildingBlocks/BuildingBlocks.Application/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Auth/BuildingBlocks.Auth.csproj", "BuildingBlocks/BuildingBlocks.Auth/"]
COPY ["src/BuildingBlocks/BuildingBlocks.EfCore/BuildingBlocks.EfCore.csproj", "BuildingBlocks/BuildingBlocks.EfCore/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Grpc/BuildingBlocks.Grpc.csproj", "BuildingBlocks/BuildingBlocks.Grpc/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Logging/BuildingBlocks.Logging.csproj", "BuildingBlocks/BuildingBlocks.Logging/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Shared/BuildingBlocks.Shared.csproj", "BuildingBlocks/BuildingBlocks.Shared/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "BuildingBlocks/BuildingBlocks.Web/"]

# Restore các gói nuget
RUN dotnet restore "Services/Identity/Identity.Api/Identity.Api.csproj"

# Copy toàn bộ source code của project
COPY src/ .

# Build dự án
WORKDIR "/src/Services/Identity/Identity.Api"
RUN dotnet publish "Identity.Api.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 5027
EXPOSE 5028

# Ép Kestrel lắng nghe trên port 5027 và 5028 cho mọi IP
ENV Kestrel__Endpoints__Http__Url=http://+:5027
ENV Kestrel__Endpoints__Grpc__Url=http://+:5028
ENV ASPNETCORE_HTTP_PORTS=5027

# Tạo user và cấp quyền cho thư mục /app
RUN adduser --disabled-password --gecos "" appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app

USER appuser
ENTRYPOINT ["dotnet", "Identity.Api.dll"]


