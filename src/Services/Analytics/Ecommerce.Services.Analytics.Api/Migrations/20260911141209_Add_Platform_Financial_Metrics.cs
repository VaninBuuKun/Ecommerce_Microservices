using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Analytics.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_Platform_Financial_Metrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "NetPlatformRevenue",
                table: "DailyPlatformRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PlatformDiscountAmount",
                table: "DailyPlatformRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "TotalGmv",
                table: "DailyPlatformRevenues",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NetPlatformRevenue",
                table: "DailyPlatformRevenues");

            migrationBuilder.DropColumn(
                name: "PlatformDiscountAmount",
                table: "DailyPlatformRevenues");

            migrationBuilder.DropColumn(
                name: "TotalGmv",
                table: "DailyPlatformRevenues");
        }
    }
}
