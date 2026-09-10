---
name: db-migration
description: Instructions for creating and applying EF Core database migrations across the 7 microservices.
---

# Database Migration Skill

## Batch Database Update Script

Chạy script đồng bộ toàn bộ hoặc từng DbContext:
```bash
# Update tất cả 8 DbContexts (bao gồm cả Duende)
./update-db.sh

# Update riêng 1 service
./update-db.sh identity
./update-db.sh duende
./update-db.sh catalog
./update-db.sh orders
./update-db.sh sellers
./update-db.sh payments
./update-db.sh shippings
./update-db.sh notifications
```

## Commands Matrix (Thêm Migration & Cập Nhật Thủ Công)

```bash
# 1. Identity Service (AppDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Identity/Identity.Api --context AppDbContext
dotnet ef database update --project src/Services/Identity/Identity.Api --context AppDbContext

# 2. Duende IdentityServer (PersistedGrantDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Identity/Identity.Api --context PersistedGrantDbContext
dotnet ef database update --project src/Services/Identity/Identity.Api --context PersistedGrantDbContext

# 3. Catalog Service (ProductDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure --startup-project src/Services/Catalogs/Ecommerce.Services.Catalog.Api --context ProductDbContext
dotnet ef database update --project src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure --startup-project src/Services/Catalogs/Ecommerce.Services.Catalog.Api --context ProductDbContext

# 4. Orders Service (OrderDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Orders/Ecommerce.Services.Orders.Infrastructure --startup-project src/Services/Orders/Ecommerce.Services.Orders.Api --context OrderDbContext
dotnet ef database update --project src/Services/Orders/Ecommerce.Services.Orders.Infrastructure --startup-project src/Services/Orders/Ecommerce.Services.Orders.Api --context OrderDbContext

# 5. Sellers Service (SellerDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Sellers/Ecommerce.Services.Sellers.Api --context SellerDbContext
dotnet ef database update --project src/Services/Sellers/Ecommerce.Services.Sellers.Api --context SellerDbContext

# 6. Payments Service (PaymentDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Payments/Ecommerce.Services.Payments.Api --context PaymentDbContext
dotnet ef database update --project src/Services/Payments/Ecommerce.Services.Payments.Api --context PaymentDbContext

# 7. Shippings Service (ShippingDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Shippings/Ecommerce.Services.Shippings.Api --context ShippingDbContext
dotnet ef database update --project src/Services/Shippings/Ecommerce.Services.Shippings.Api --context ShippingDbContext

# 8. Notifications Service (NotificationDbContext)
dotnet ef migrations add <MigrationName> --project src/Services/Notifications/Ecommerce.Services.Notifications.Api --context NotificationDbContext
dotnet ef database update --project src/Services/Notifications/Ecommerce.Services.Notifications.Api --context NotificationDbContext
```

