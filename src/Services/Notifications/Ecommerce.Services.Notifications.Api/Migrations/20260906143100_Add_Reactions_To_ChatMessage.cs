using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Notifications.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_Reactions_To_ChatMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReactionsJson",
                table: "ChatMessages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastReaction",
                table: "ChatMessages",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastReaction",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "ReactionsJson",
                table: "ChatMessages");
        }
    }
}
