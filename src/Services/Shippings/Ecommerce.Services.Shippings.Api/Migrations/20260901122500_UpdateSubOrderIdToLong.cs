using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Shippings.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubOrderIdToLong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sử dụng SQL trực tiếp để alter column uuid sang bigint an toàn trong PostgreSQL cho cả SubOrderId và OrderId
            migrationBuilder.Sql("ALTER TABLE \"Shipments\" ALTER COLUMN \"SubOrderId\" TYPE bigint USING 0;");
            migrationBuilder.Sql("ALTER TABLE \"Shipments\" ALTER COLUMN \"OrderId\" TYPE bigint USING 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Shipments\" ALTER COLUMN \"SubOrderId\" TYPE uuid USING gen_random_uuid();");
            migrationBuilder.Sql("ALTER TABLE \"Shipments\" ALTER COLUMN \"OrderId\" TYPE uuid USING gen_random_uuid();");
        }
    }
}
