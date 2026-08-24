# ==============================================================================
# AUTOMATIC SQL MIGRATIONS GENERATOR FOR MICROSERVICES (POSTGRESQL)
# ==============================================================================

$ErrorActionPreference = "Stop"
$OutputDir = "scripts/migrations"

Write-Host "Starting automatic SQL Migrations generation..." -ForegroundColor Green

if (!(Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Yellow
}

$Services = @(
    @{
        Name = "01_identity_app"
        Project = "src/Services/Identity/Identity.Api"
        Startup = "src/Services/Identity/Identity.Api"
        Context = "AppDbContext"
    },
    @{
        Name = "02_identity_persisted_grant"
        Project = "src/Services/Identity/Identity.Api"
        Startup = "src/Services/Identity/Identity.Api"
        Context = "Duende.IdentityServer.EntityFramework.DbContexts.PersistedGrantDbContext"
    },
    @{
        Name = "03_catalog"
        Project = "src/Services/Catalogs/Ecommerce.Services.Catalog.Infrastructure"
        Startup = "src/Services/Catalogs/Ecommerce.Services.Catalog.Api"
        Context = "ProductDbContext"
    },
    @{
        Name = "04_orders"
        Project = "src/Services/Orders/Ecommerce.Services.Orders.Infrastructure"
        Startup = "src/Services/Orders/Ecommerce.Services.Orders.Api"
        Context = "OrderDbContext"
    },
    @{
        Name = "05_payments"
        Project = "src/Services/Payments/Ecommerce.Services.Payments.Api"
        Startup = "src/Services/Payments/Ecommerce.Services.Payments.Api"
        Context = "PaymentDbContext"
    },
    @{
        Name = "06_sellers"
        Project = "src/Services/Sellers/Ecommerce.Services.Sellers.Api"
        Startup = "src/Services/Sellers/Ecommerce.Services.Sellers.Api"
        Context = "SellerDbContext"
    },
    @{
        Name = "07_shippings"
        Project = "src/Services/Shippings/Ecommerce.Services.Shippings.Api"
        Startup = "src/Services/Shippings/Ecommerce.Services.Shippings.Api"
        Context = "ShippingDbContext"
    }
)

foreach ($svc in $Services) {
    $OutputFile = "$OutputDir/$($svc.Name)_schema.sql"
    Write-Host "Generating idempotent SQL for $($svc.Name) ($($svc.Context))..." -ForegroundColor Cyan

    dotnet ef migrations script --idempotent `
        --project $svc.Project `
        --startup-project $svc.Startup `
        --context $svc.Context `
        --output $OutputFile

    if (Test-Path $OutputFile) {
        Write-Host "SUCCESS: Created $OutputFile" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to generate SQL for $($svc.Name)" -ForegroundColor Red
    }
}

Write-Host "COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "All SQL Idempotent Migrations exported to: $OutputDir" -ForegroundColor Yellow
