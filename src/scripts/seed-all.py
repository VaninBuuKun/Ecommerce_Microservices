import psycopg2
import os

print("==================================================")
print("🚀 ECOMMERCE MICROSERVICES - SEED DATA SCRIPT")
print("==================================================")

# Postgres Connection Configuration
DB_HOST = "localhost"
DB_PORT = 5433
DB_USER = "db_user"
DB_PASS = "123456"

base_dir = os.path.dirname(os.path.abspath(__file__))
seed_dir = os.path.join(base_dir, "seed-data")

db_configs = [
    ("IdentityDb", os.path.join(seed_dir, "01_seed_identity.sql")),
    ("SellerDb", os.path.join(seed_dir, "02_seed_sellers.sql")),
    ("ProductCatalogDb", os.path.join(seed_dir, "03_seed_catalog.sql")),
    ("OrderDb", os.path.join(seed_dir, "04_seed_orders.sql"))
]

for db_name, sql_path in db_configs:
    print(f"\n⏳ Seeding database: {db_name}...")
    if not os.path.exists(sql_path):
        print(f"❌ File not found: {sql_path}")
        continue
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=db_name,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        with conn.cursor() as cursor:
            with open(sql_path, "r", encoding="utf-8") as f:
                sql_content = f.read()
                cursor.execute(sql_content)
        print(f"✅ {db_name} seeded successfully!")
        conn.close()
    except Exception as e:
        print(f"❌ Failed to seed {db_name}: {e}")

print("\n==================================================")
print("🎉 ALL DATABASES SEEDED SUCCESSFULLY!")
print("==================================================")
