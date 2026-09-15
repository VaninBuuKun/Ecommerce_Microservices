using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Analytics.Api.Migrations
{
    /// <inheritdoc />
    public partial class Simplify_Category_Analytics_To_Parent_Only : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailyCategoryRevenues_Date_ParentCategoryId",
                table: "DailyCategoryRevenues");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "CategoryName",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "ParentCategoryName",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "ParentCategoryName",
                table: "DailyCategoryRevenues");

            migrationBuilder.DropColumn(
                name: "SubCategoryId",
                table: "DailyCategoryRevenues");

            migrationBuilder.DropColumn(
                name: "SubCategoryName",
                table: "DailyCategoryRevenues");

            migrationBuilder.CreateIndex(
                name: "IX_DailyCategoryRevenues_Date_ParentCategoryId",
                table: "DailyCategoryRevenues",
                columns: new[] { "Date", "ParentCategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyCategoryRevenues_ParentCategoryId",
                table: "DailyCategoryRevenues",
                column: "ParentCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailyCategoryRevenues_Date_ParentCategoryId",
                table: "DailyCategoryRevenues");

            migrationBuilder.DropIndex(
                name: "IX_DailyCategoryRevenues_ParentCategoryId",
                table: "DailyCategoryRevenues");

            migrationBuilder.AddColumn<long>(
                name: "CategoryId",
                table: "ShopProductStats",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CategoryName",
                table: "ShopProductStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentCategoryName",
                table: "ShopProductStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentCategoryName",
                table: "DailyCategoryRevenues",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "SubCategoryId",
                table: "DailyCategoryRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "SubCategoryName",
                table: "DailyCategoryRevenues",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_DailyCategoryRevenues_Date_ParentCategoryId",
                table: "DailyCategoryRevenues",
                columns: new[] { "Date", "ParentCategoryId" });
        }
    }
}
