using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Add_MaxPrice_And_SearchExtensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,")
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Products"" 
                ALTER COLUMN ""AttributesJson"" TYPE jsonb 
                USING (
                    CASE 
                        WHEN ""AttributesJson"" IS NULL OR trim(""AttributesJson"") = '' THEN NULL 
                        ELSE ""AttributesJson""::jsonb 
                    END
                );
            ");

            migrationBuilder.AddColumn<decimal>(
                name: "MaxPrice",
                table: "Products",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON \"Products\" USING gin (\"Name\" gin_trgm_ops);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON \"Products\" USING gin (\"AttributesJson\");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPrice",
                table: "Products");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:unaccent", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "AttributesJson",
                table: "Products",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);
        }
    }
}
