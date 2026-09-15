using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Sellers.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStringLocationsFromPickUpAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PickUp_District",
                table: "Shops");

            migrationBuilder.DropColumn(
                name: "PickUp_Province",
                table: "Shops");

            migrationBuilder.DropColumn(
                name: "PickUp_Ward",
                table: "Shops");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PickUp_District",
                table: "Shops",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickUp_Province",
                table: "Shops",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickUp_Ward",
                table: "Shops",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
