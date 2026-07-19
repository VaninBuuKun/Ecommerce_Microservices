using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Sellers.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialSellerDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SellerKycs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    IdentityCardNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectReason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    VerifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerKycs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shops",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    PickUp_RecipientName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PickUp_Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PickUp_Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PickUp_District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PickUp_Ward = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PickUp_AddressLine = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PickUp_ProvinceId = table.Column<int>(type: "integer", nullable: false),
                    PickUp_DistrictId = table.Column<int>(type: "integer", nullable: false),
                    PickUp_WardCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shops", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SellerKycs");

            migrationBuilder.DropTable(
                name: "Shops");
        }
    }
}
