using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShippingAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "PaymentMethodId",
                table: "OrderSagaState",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "PaymentUrl",
                table: "OrderSagaState",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SerializedVariantIds",
                table: "OrderSagaState",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShippingAddress",
                table: "OrderSagaState",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShippingAddress",
                table: "Orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMethodId",
                table: "OrderSagaState");

            migrationBuilder.DropColumn(
                name: "PaymentUrl",
                table: "OrderSagaState");

            migrationBuilder.DropColumn(
                name: "SerializedVariantIds",
                table: "OrderSagaState");

            migrationBuilder.DropColumn(
                name: "ShippingAddress",
                table: "OrderSagaState");

            migrationBuilder.DropColumn(
                name: "ShippingAddress",
                table: "Orders");
        }
    }
}
