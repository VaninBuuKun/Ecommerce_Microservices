using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVoucher2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Vouchers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DiscountType = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    MinOrderValue = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxUsageCount = table.Column<long>(type: "bigint", nullable: false),
                    UsageCount = table.Column<long>(type: "bigint", nullable: false),
                    MaxUsagePerUser = table.Column<long>(type: "bigint", nullable: false),
                    MaxDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ShopId = table.Column<long>(type: "bigint", nullable: true),
                    StartDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vouchers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VoucherUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VoucherId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    SubOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    DiscountAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    UsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VoucherUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VoucherUsages_Vouchers_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "Vouchers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VoucherUsages_VoucherId",
                table: "VoucherUsages",
                column: "VoucherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VoucherUsages");

            migrationBuilder.DropTable(
                name: "Vouchers");
        }
    }
}
