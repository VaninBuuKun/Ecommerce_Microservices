using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Analytics.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_Category_Revenue_And_Shipping_Settlements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<long>(
                name: "ParentCategoryId",
                table: "ShopProductStats",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentCategoryName",
                table: "ShopProductStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CancelledOrderCount",
                table: "DailyShopRevenues",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "RefundAmount",
                table: "DailyShopRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "RefundedOrderCount",
                table: "DailyShopRevenues",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "TotalShippingFee",
                table: "DailyPlatformRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "DailyCategoryRevenues",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    ParentCategoryId = table.Column<long>(type: "bigint", nullable: false),
                    ParentCategoryName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SubCategoryId = table.Column<long>(type: "bigint", nullable: false),
                    SubCategoryName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Revenue = table.Column<long>(type: "bigint", nullable: false),
                    SoldQuantity = table.Column<int>(type: "integer", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyCategoryRevenues", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShopProductStats_ParentCategoryId",
                table: "ShopProductStats",
                column: "ParentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyCategoryRevenues_Date",
                table: "DailyCategoryRevenues",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_DailyCategoryRevenues_Date_ParentCategoryId",
                table: "DailyCategoryRevenues",
                columns: new[] { "Date", "ParentCategoryId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyCategoryRevenues");

            migrationBuilder.DropIndex(
                name: "IX_ShopProductStats_ParentCategoryId",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "CategoryName",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "ParentCategoryId",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "ParentCategoryName",
                table: "ShopProductStats");

            migrationBuilder.DropColumn(
                name: "CancelledOrderCount",
                table: "DailyShopRevenues");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "DailyShopRevenues");

            migrationBuilder.DropColumn(
                name: "RefundedOrderCount",
                table: "DailyShopRevenues");

            migrationBuilder.DropColumn(
                name: "TotalShippingFee",
                table: "DailyPlatformRevenues");
        }
    }
}
