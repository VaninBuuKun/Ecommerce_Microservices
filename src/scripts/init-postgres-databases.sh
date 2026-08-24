#!/bin/bash
set -e

# Script khởi tạo 6 Databases và nạp Schema Migration tự động 100% cho PostgreSQL
# Thư mục này chỉ được Docker Postgres thực thi 1 LẦN DUY NHẤT khi khởi tạo volume dữ liệu mới.

echo "=========================================================="
echo "🚀 STARTING INITIALIZATION OF MICROSERVICES DATABASES"
echo "=========================================================="

# Hàm khởi tạo Database nếu chưa tồn tại
create_database_if_not_exists() {
	local db_name=$1
	echo "📌 Checking/Creating Database: '$db_name'..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	    SELECT 'CREATE DATABASE "$db_name"'
	    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db_name')\gexec
EOSQL
}

# 1. Tạo đủ 6 Databases độc lập
DATABASES=("IdentityDb" "ProductCatalogDb" "OrderDb" "PaymentDb" "SellerDb" "ShippingDb")
for db in "${DATABASES[@]}"; do
	create_database_if_not_exists "$db"
done

echo "=========================================================="
echo "⚡ APPLYING IDEMPOTENT SQL SCHEMAS TO EACH DATABASE"
echo "=========================================================="

# Hàm nạp file SQL vào Database cụ thể
apply_sql_script() {
	local db_name=$1
	local sql_file=$2

	if [ -f "$sql_file" ]; then
		echo "📥 Applying $sql_file to database '$db_name'..."
		psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" -f "$sql_file"
		echo "  ✅ Successfully applied schema to '$db_name'."
	else
		echo "  ⚠️ Warning: SQL file '$sql_file' not found. Skipping."
	fi
}

# 2. Nạp toàn bộ Bảng/Schema vào đúng Database tương ứng
apply_sql_script "IdentityDb" "/docker-entrypoint-initdb.d/migrations/01_identity_app_schema.sql"
apply_sql_script "IdentityDb" "/docker-entrypoint-initdb.d/migrations/02_identity_persisted_grant_schema.sql"
apply_sql_script "ProductCatalogDb" "/docker-entrypoint-initdb.d/migrations/03_catalog_schema.sql"
apply_sql_script "OrderDb" "/docker-entrypoint-initdb.d/migrations/04_orders_schema.sql"
apply_sql_script "PaymentDb" "/docker-entrypoint-initdb.d/migrations/05_payments_schema.sql"
apply_sql_script "SellerDb" "/docker-entrypoint-initdb.d/migrations/06_sellers_schema.sql"
apply_sql_script "ShippingDb" "/docker-entrypoint-initdb.d/migrations/07_shippings_schema.sql"

echo "=========================================================="
echo "🎉 ALL MICROSERVICES DATABASES AND SCHEMAS INITIALIZED 100%!"
echo "=========================================================="
