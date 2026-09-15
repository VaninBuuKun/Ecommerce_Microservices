using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Payments.Api.Migrations
{
    /// <inheritdoc />
    public partial class Remove_Redundant_Commission_And_RevenueRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformCommissionConfigs");

            migrationBuilder.DropTable(
                name: "RevenueRecords");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlatformCommissionConfigs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RatePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
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
                    CommissionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CommissionRatePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PlatformDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    SubOrderId = table.Column<long>(type: "bigint", nullable: false)
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
    }
}
