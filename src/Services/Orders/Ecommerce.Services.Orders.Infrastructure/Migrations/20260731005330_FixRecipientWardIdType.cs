using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixRecipientWardIdType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Orders\" ALTER COLUMN \"RecipientWardId\" TYPE bigint USING \"RecipientWardId\"::bigint;");
            migrationBuilder.Sql("ALTER TABLE \"SubOrderSagaStates\" ALTER COLUMN \"RecipientWardId\" TYPE bigint USING \"RecipientWardId\"::bigint;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Orders\" ALTER COLUMN \"RecipientWardId\" TYPE text;");
            migrationBuilder.Sql("ALTER TABLE \"SubOrderSagaStates\" ALTER COLUMN \"RecipientWardId\" TYPE text;");
        }
    }
}
