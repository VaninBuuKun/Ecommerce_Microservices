# PowerShell script: Tự động chạy tất cả SQL Seed Scripts vào PostgreSQL Databases
$PGHOST = "localhost"
$PGPORT = "5433"
$PGUSER = "db_user"
$PGPASSWORD = "123456"

$env:PGPASSWORD = $PGPASSWORD

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 BẮT ĐẦU CHẠY SEED DATA CHO MICROSERVICES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. IdentityDb
Write-Host "1. Seeding IdentityDb..." -ForegroundColor Yellow
psql -h $PGHOST -p $PGPORT -U $PGUSER -d IdentityDb -f "src/scripts/seed-data/01_seed_identity.sql"

# 2. SellerDb
Write-Host "2. Seeding SellerDb..." -ForegroundColor Yellow
psql -h $PGHOST -p $PGPORT -U $PGUSER -d SellerDb -f "src/scripts/seed-data/02_seed_sellers.sql"

# 3. ProductCatalogDb
Write-Host "3. Seeding ProductCatalogDb..." -ForegroundColor Yellow
psql -h $PGHOST -p $PGPORT -U $PGUSER -d ProductCatalogDb -f "src/scripts/seed-data/03_seed_catalog.sql"

# 4. OrderDb
Write-Host "4. Seeding OrderDb..." -ForegroundColor Yellow
psql -h $PGHOST -p $PGPORT -U $PGUSER -d OrderDb -f "src/scripts/seed-data/04_seed_orders.sql"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 HOÀN THÀNH SEED DỮ LIỆU THÀNH CÔNG!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
