using System;
using System.IO;
using Npgsql;

namespace SeedRunner;

class Program
{
    static void Main(string[] args)
    {
        string connStrFormat = "Host=localhost;Port=5433;Username=db_user;Password=123456;Database={0}";
        
        // Ensure Databases exist
        EnsureDatabaseExists("ProductCatalogDb");

        var seedFiles = new (string db, string file)[]
        {
            ("IdentityDb", "src/scripts/seed-data/01_seed_identity.sql"),
            ("SellerDb", "src/scripts/seed-data/02_seed_sellers.sql"),
            ("ProductCatalogDb", "src/scripts/seed-data/03_seed_catalog.sql"),
            ("OrderDb", "src/scripts/seed-data/04_seed_orders.sql")
        };

        foreach (var (db, relativePath) in seedFiles)
        {
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);
            if (!File.Exists(fullPath))
            {
                Console.WriteLine($"[SKIP] File not found: {fullPath}");
                continue;
            }

            Console.WriteLine($"[SEEDING] {db} using {relativePath}...");
            var sql = File.ReadAllText(fullPath);
            var connStr = string.Format(connStrFormat, db);

            try
            {
                using var conn = new NpgsqlConnection(connStr);
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = sql;
                cmd.ExecuteNonQuery();
                Console.WriteLine($"[SUCCESS] Seeded {db} successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed {db}: {ex.Message}");
            }
        }
    }

    static void EnsureDatabaseExists(string dbName)
    {
        try
        {
            using var conn = new NpgsqlConnection("Host=localhost;Port=5433;Username=db_user;Password=123456;Database=postgres");
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT 1 FROM pg_database WHERE datname = '{dbName}';";
            var exists = cmd.ExecuteScalar() != null;
            if (!exists)
            {
                using var createCmd = conn.CreateCommand();
                createCmd.CommandText = $"CREATE DATABASE \"{dbName}\";";
                createCmd.ExecuteNonQuery();
                Console.WriteLine($"[DB] Created database '{dbName}'");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] {ex.Message}");
        }
    }
}
