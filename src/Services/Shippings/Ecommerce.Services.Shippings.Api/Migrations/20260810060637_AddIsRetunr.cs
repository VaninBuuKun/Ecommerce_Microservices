using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Shippings.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRetunr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRefund",
                table: "Shipments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRefund",
                table: "Shipments");
        }
    }
}
