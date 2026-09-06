using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Payments.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_MinAmount_To_PaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MinAmount",
                table: "PaymentMethods",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"PaymentMethods\" SET \"MinAmount\" = 10000 WHERE LOWER(\"ProviderName\") IN ('momo', 'vnpay');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MinAmount",
                table: "PaymentMethods");
        }
    }
}
