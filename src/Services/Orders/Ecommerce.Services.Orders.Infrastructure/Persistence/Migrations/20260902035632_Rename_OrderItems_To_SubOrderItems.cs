using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Rename_OrderItems_To_SubOrderItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_SubOrders_SubOrderId",
                table: "OrderItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderItems",
                table: "OrderItems");

            migrationBuilder.RenameTable(
                name: "OrderItems",
                newName: "SubOrderItems");

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_SubOrderId",
                table: "SubOrderItems",
                newName: "IX_SubOrderItems_SubOrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SubOrderItems",
                table: "SubOrderItems",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SubOrderItems_SubOrders_SubOrderId",
                table: "SubOrderItems",
                column: "SubOrderId",
                principalTable: "SubOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SubOrderItems_SubOrders_SubOrderId",
                table: "SubOrderItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SubOrderItems",
                table: "SubOrderItems");

            migrationBuilder.RenameTable(
                name: "SubOrderItems",
                newName: "OrderItems");

            migrationBuilder.RenameIndex(
                name: "IX_SubOrderItems_SubOrderId",
                table: "OrderItems",
                newName: "IX_OrderItems_SubOrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderItems",
                table: "OrderItems",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_SubOrders_SubOrderId",
                table: "OrderItems",
                column: "SubOrderId",
                principalTable: "SubOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
