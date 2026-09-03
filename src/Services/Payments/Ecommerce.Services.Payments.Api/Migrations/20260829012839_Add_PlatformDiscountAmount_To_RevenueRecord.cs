using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Payments.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_PlatformDiscountAmount_To_RevenueRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PlatformDiscountAmount",
                table: "RevenueRecords",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlatformDiscountAmount",
                table: "RevenueRecords");
        }
    }
}
