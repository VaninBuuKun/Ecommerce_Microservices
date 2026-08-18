using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVoucherForSubOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PlatformVoucherId",
                table: "SubOrders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ShopVoucherId",
                table: "SubOrders",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlatformVoucherId",
                table: "SubOrders");

            migrationBuilder.DropColumn(
                name: "ShopVoucherId",
                table: "SubOrders");
        }
    }
}
