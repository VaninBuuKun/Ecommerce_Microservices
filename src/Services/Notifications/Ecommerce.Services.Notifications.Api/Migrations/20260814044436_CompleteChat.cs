using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Notifications.Api.Migrations
{
    /// <inheritdoc />
    public partial class CompleteChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "SenderRole",
                table: "ChatMessages");

            migrationBuilder.RenameColumn(
                name: "SubOrderId",
                table: "ChatMessages",
                newName: "RoomId");

            migrationBuilder.RenameIndex(
                name: "IX_ChatMessages_SubOrderId",
                table: "ChatMessages",
                newName: "IX_ChatMessages_RoomId");

            migrationBuilder.CreateTable(
                name: "ChatRooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    BuyerUserId = table.Column<long>(type: "bigint", nullable: false),
                    LastMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    LastActiveAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRooms", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_LastActiveAt",
                table: "ChatRooms",
                column: "LastActiveAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_ShopId_BuyerUserId",
                table: "ChatRooms",
                columns: new[] { "ShopId", "BuyerUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatRooms");

            migrationBuilder.RenameColumn(
                name: "RoomId",
                table: "ChatMessages",
                newName: "SubOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_ChatMessages_RoomId",
                table: "ChatMessages",
                newName: "IX_ChatMessages_SubOrderId");

            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "ChatMessages",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderRole",
                table: "ChatMessages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }
    }
}
