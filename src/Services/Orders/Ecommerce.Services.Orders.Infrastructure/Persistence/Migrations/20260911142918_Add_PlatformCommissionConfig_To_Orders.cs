using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Add_PlatformCommissionConfig_To_Orders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformCommissionConfigs");
        }
    }
}
