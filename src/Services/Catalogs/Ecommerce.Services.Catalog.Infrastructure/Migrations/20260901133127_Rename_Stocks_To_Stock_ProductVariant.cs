using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Rename_Stocks_To_Stock_ProductVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReservedStocks",
                table: "ProductVariants",
                newName: "ReservedStock");

            migrationBuilder.RenameColumn(
                name: "AvailableStocks",
                table: "ProductVariants",
                newName: "AvailableStock");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReservedStock",
                table: "ProductVariants",
                newName: "ReservedStocks");

            migrationBuilder.RenameColumn(
                name: "AvailableStock",
                table: "ProductVariants",
                newName: "AvailableStocks");
        }
    }
}
