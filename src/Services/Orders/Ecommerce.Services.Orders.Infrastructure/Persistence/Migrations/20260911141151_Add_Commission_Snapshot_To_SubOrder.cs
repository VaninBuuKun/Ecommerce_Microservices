using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Add_Commission_Snapshot_To_SubOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "CommissionFee",
                table: "SubOrderSagaStates",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRate",
                table: "SubOrderSagaStates",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<long>(
                name: "CommissionFee",
                table: "SubOrders",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRate",
                table: "SubOrders",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommissionFee",
                table: "SubOrderSagaStates");

            migrationBuilder.DropColumn(
                name: "CommissionRate",
                table: "SubOrderSagaStates");

            migrationBuilder.DropColumn(
                name: "CommissionFee",
                table: "SubOrders");

            migrationBuilder.DropColumn(
                name: "CommissionRate",
                table: "SubOrders");
        }
    }
}
