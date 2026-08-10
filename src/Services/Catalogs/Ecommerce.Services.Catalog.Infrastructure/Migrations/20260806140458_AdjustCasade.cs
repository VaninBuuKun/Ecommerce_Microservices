using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdjustCasade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariantOptions_ProductOptionValues_OptionValueId",
                table: "ProductVariantOptions");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariantOptions_ProductOptionValues_OptionValueId",
                table: "ProductVariantOptions",
                column: "OptionValueId",
                principalTable: "ProductOptionValues",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariantOptions_ProductOptionValues_OptionValueId",
                table: "ProductVariantOptions");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariantOptions_ProductOptionValues_OptionValueId",
                table: "ProductVariantOptions",
                column: "OptionValueId",
                principalTable: "ProductOptionValues",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
