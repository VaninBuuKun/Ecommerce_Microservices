using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Sellers.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGhnId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GhnShopId",
                table: "Shops");

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Shops",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityCardBackUrl",
                table: "SellerKycs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdentityCardFrontUrl",
                table: "SellerKycs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Shops");

            migrationBuilder.DropColumn(
                name: "IdentityCardBackUrl",
                table: "SellerKycs");

            migrationBuilder.DropColumn(
                name: "IdentityCardFrontUrl",
                table: "SellerKycs");

            migrationBuilder.AddColumn<string>(
                name: "GhnShopId",
                table: "Shops",
                type: "text",
                nullable: true);
        }
    }
}
