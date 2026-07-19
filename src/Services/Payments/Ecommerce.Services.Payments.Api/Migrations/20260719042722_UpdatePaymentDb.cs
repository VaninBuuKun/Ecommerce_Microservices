using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Payments.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "TargetId",
                table: "Payments",
                newName: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "Payments",
                newName: "TargetId");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
