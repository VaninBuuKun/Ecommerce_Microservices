using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Remove_AttemptCount_From_RefundRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttemptCount",
                table: "RefundRequests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AttemptCount",
                table: "RefundRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
