using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Add_Product_SearchDocument_GinTrgm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SearchDocument",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE ""Products""
                SET ""SearchDocument"" = lower(""Name"")
                WHERE ""SearchDocument"" IS NULL OR ""SearchDocument"" = '';
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SearchDocument",
                table: "Products",
                column: "SearchDocument")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_SearchDocument",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SearchDocument",
                table: "Products");
        }
    }
}
