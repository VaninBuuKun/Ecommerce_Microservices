---
name: db-migration
description: Instructions for creating and applying EF Core database migrations across the 7 microservices.
---

# Database Migration Skill

## Commands Matrix

```powershell
# Sellers Service
dotnet ef migrations add <MigrationName> --project src/Services/Sellers/Ecommerce.Services.Sellers.Api
dotnet ef database update --project src/Services/Sellers/Ecommerce.Services.Sellers.Api

# Orders Service
dotnet ef migrations add <MigrationName> --project src/Services/Orders/Ecommerce.Services.Orders.Api --infrastructure src/Services/Orders/Ecommerce.Services.Orders.Infrastructure
dotnet ef database update --project src/Services/Orders/Ecommerce.Services.Orders.Api --infrastructure src/Services/Orders/Ecommerce.Services.Orders.Infrastructure

# Payments Service
dotnet ef migrations add <MigrationName> --project src/Services/Payments/Ecommerce.Services.Payments.Api
dotnet ef database update --project src/Services/Payments/Ecommerce.Services.Payments.Api

# Catalog Service
dotnet ef migrations add <MigrationName> --project src/Services/Catalogs/Ecommerce.Services.Catalog.Api --infrastructure src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure
dotnet ef database update --project src/Services/Catalogs/Ecommerce.Services.Catalog.Api --infrastructure src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure
```
