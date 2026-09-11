using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Recommendations.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialRecommendationDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InboxState",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsumerId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Received = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceiveCount = table.Column<int>(type: "integer", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Consumed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxState", x => x.Id);
                    table.UniqueConstraint("AK_InboxState_MessageId_ConsumerId", x => new { x.MessageId, x.ConsumerId });
                });

            migrationBuilder.CreateTable(
                name: "MaterializedCategories",
                columns: table => new
                {
                    CategoryId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    Level = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterializedCategories", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "MaterializedProducts",
                columns: table => new
                {
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DiscountPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    AttributesJson = table.Column<string>(type: "text", nullable: true),
                    Sold = table.Column<int>(type: "integer", nullable: false),
                    AverageRating = table.Column<double>(type: "double precision", nullable: false),
                    ReviewCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterializedProducts", x => x.ProductId);
                });

            migrationBuilder.CreateTable(
                name: "OutboxState",
                columns: table => new
                {
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxState", x => x.OutboxId);
                });

            migrationBuilder.CreateTable(
                name: "ProductViews",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    SessionId = table.Column<string>(type: "text", nullable: true),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductViews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserPurchaseHistories",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPurchaseHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserWishlistItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ToggledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserWishlistItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessage",
                columns: table => new
                {
                    SequenceNumber = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnqueueTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Headers = table.Column<string>(type: "text", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    InboxMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    InboxConsumerId = table.Column<Guid>(type: "uuid", nullable: true),
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    MessageType = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: true),
                    InitiatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DestinationAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ResponseAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    FaultAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessage", x => x.SequenceNumber);
                    table.ForeignKey(
                        name: "FK_OutboxMessage_InboxState_InboxMessageId_InboxConsumerId",
                        columns: x => new { x.InboxMessageId, x.InboxConsumerId },
                        principalTable: "InboxState",
                        principalColumns: new[] { "MessageId", "ConsumerId" });
                    table.ForeignKey(
                        name: "FK_OutboxMessage_OutboxState_OutboxId",
                        column: x => x.OutboxId,
                        principalTable: "OutboxState",
                        principalColumn: "OutboxId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboxState_Delivered",
                table: "InboxState",
                column: "Delivered");

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedCategories_ParentId",
                table: "MaterializedCategories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_AverageRating_IsActive",
                table: "MaterializedProducts",
                columns: new[] { "AverageRating", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_CategoryId",
                table: "MaterializedProducts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_CategoryId_IsActive",
                table: "MaterializedProducts",
                columns: new[] { "CategoryId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_IsActive",
                table: "MaterializedProducts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_ShopId",
                table: "MaterializedProducts",
                column: "ShopId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterializedProducts_Sold_IsActive",
                table: "MaterializedProducts",
                columns: new[] { "Sold", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_EnqueueTime",
                table: "OutboxMessage",
                column: "EnqueueTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_ExpirationTime",
                table: "OutboxMessage",
                column: "ExpirationTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_InboxMessageId_InboxConsumerId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "InboxMessageId", "InboxConsumerId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_OutboxId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "OutboxId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxState_Created",
                table: "OutboxState",
                column: "Created");

            migrationBuilder.CreateIndex(
                name: "IX_ProductViews_ProductId",
                table: "ProductViews",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductViews_SessionId",
                table: "ProductViews",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductViews_UserId",
                table: "ProductViews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductViews_UserId_ProductId",
                table: "ProductViews",
                columns: new[] { "UserId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductViews_ViewedAt",
                table: "ProductViews",
                column: "ViewedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserPurchaseHistories_CategoryId",
                table: "UserPurchaseHistories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPurchaseHistories_ProductId",
                table: "UserPurchaseHistories",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPurchaseHistories_PurchasedAt",
                table: "UserPurchaseHistories",
                column: "PurchasedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserPurchaseHistories_UserId",
                table: "UserPurchaseHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPurchaseHistories_UserId_CategoryId",
                table: "UserPurchaseHistories",
                columns: new[] { "UserId", "CategoryId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserWishlistItems_ProductId",
                table: "UserWishlistItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_UserWishlistItems_UserId",
                table: "UserWishlistItems",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserWishlistItems_UserId_IsActive",
                table: "UserWishlistItems",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaterializedCategories");

            migrationBuilder.DropTable(
                name: "MaterializedProducts");

            migrationBuilder.DropTable(
                name: "OutboxMessage");

            migrationBuilder.DropTable(
                name: "ProductViews");

            migrationBuilder.DropTable(
                name: "UserPurchaseHistories");

            migrationBuilder.DropTable(
                name: "UserWishlistItems");

            migrationBuilder.DropTable(
                name: "InboxState");

            migrationBuilder.DropTable(
                name: "OutboxState");
        }
    }
}
