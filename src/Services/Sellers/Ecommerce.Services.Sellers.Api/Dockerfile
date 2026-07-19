FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for restoring dependencies
COPY ["Services/Sellers/Ecommerce.Services.Sellers.Api/Ecommerce.Services.Sellers.Api.csproj", "Services/Sellers/Ecommerce.Services.Sellers.Api/"]
COPY ["Services/Sellers/Ecommerce.Services.Sellers.Contracts/Ecommerce.Services.Sellers.Contracts.csproj", "Services/Sellers/Ecommerce.Services.Sellers.Contracts/"]
COPY ["BuildingBlocks/BuildingBlocks.Shared/BuildingBlocks.Shared.csproj", "BuildingBlocks/BuildingBlocks.Shared/"]
COPY ["BuildingBlocks/BuildingBlocks.EfCore/BuildingBlocks.EfCore.csproj", "BuildingBlocks/BuildingBlocks.EfCore/"]
COPY ["BuildingBlocks/BuildingBlocks.Grpc/BuildingBlocks.Grpc.csproj", "BuildingBlocks/BuildingBlocks.Grpc/"]
COPY ["BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "BuildingBlocks/BuildingBlocks.Messaging/"]
COPY ["BuildingBlocks/BuildingBlocks.Auth/BuildingBlocks.Auth.csproj", "BuildingBlocks/BuildingBlocks.Auth/"]
COPY ["BuildingBlocks/BuildingBlocks.Logging/BuildingBlocks.Logging.csproj", "BuildingBlocks/BuildingBlocks.Logging/"]
COPY ["BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "BuildingBlocks/BuildingBlocks.Web/"]

RUN dotnet restore "Services/Sellers/Ecommerce.Services.Sellers.Api/Ecommerce.Services.Sellers.Api.csproj"

# Copy the entire source code
COPY . .
WORKDIR "/src/Services/Sellers/Ecommerce.Services.Sellers.Api"
RUN dotnet build "Ecommerce.Services.Sellers.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Ecommerce.Services.Sellers.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Ecommerce.Services.Sellers.Api.dll"]
