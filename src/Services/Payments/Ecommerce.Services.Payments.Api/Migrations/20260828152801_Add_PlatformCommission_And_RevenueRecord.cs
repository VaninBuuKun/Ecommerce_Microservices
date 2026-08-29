using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Payments.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_PlatformCommission_And_RevenueRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"WalletTransactions\" ALTER COLUMN \"ReferenceId\" TYPE text USING \"ReferenceId\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Payments\" ALTER COLUMN \"OrderId\" TYPE bigint USING 0;");

            migrationBuilder.CreateTable(
                name: "PlatformCommissionConfigs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RatePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformCommissionConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RevenueRecords",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubOrderId = table.Column<long>(type: "bigint", nullable: false),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CommissionRatePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevenueRecords", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PlatformCommissionConfigs",
                columns: new[] { "Id", "CreatedDate", "LastModifiedDate", "RatePercentage", "UpdatedByUserId" },
                values: new object[] { 1L, new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), 5.0m, null });

            migrationBuilder.CreateIndex(
                name: "IX_RevenueRecords_ShopId",
                table: "RevenueRecords",
                column: "ShopId");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueRecords_SubOrderId",
                table: "RevenueRecords",
                column: "SubOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformCommissionConfigs");

            migrationBuilder.DropTable(
                name: "RevenueRecords");


            migrationBuilder.AlterColumn<Guid>(
                name: "OrderId",
                table: "Payments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");
        }
    }
}
