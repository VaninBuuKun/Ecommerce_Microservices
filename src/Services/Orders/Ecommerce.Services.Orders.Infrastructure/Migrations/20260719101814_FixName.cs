using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SubOrderId1",
                table: "OrderItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_SubOrderId1",
                table: "OrderItems",
                column: "SubOrderId1");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_SubOrders_SubOrderId1",
                table: "OrderItems",
                column: "SubOrderId1",
                principalTable: "SubOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_SubOrders_SubOrderId1",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_SubOrderId1",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "SubOrderId1",
                table: "OrderItems");
        }
    }
}
