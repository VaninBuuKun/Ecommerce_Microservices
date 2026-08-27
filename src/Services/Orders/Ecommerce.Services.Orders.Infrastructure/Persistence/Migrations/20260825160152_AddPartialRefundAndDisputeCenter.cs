using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPartialRefundAndDisputeCenter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RefundRequests");

            migrationBuilder.CreateTable(
                name: "RefundRequests",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<long>(type: "bigint", nullable: false),
                    ShopId = table.Column<long>(type: "bigint", nullable: false),
                    Reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ProofImagesJson = table.Column<string>(type: "text", nullable: true),
                    RequestedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SellerRejectReason = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DisputeThreads",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefundRequestId = table.Column<long>(type: "bigint", nullable: false),
                    DeadlineDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ResolvedByAdminId = table.Column<long>(type: "bigint", nullable: true),
                    ResolutionDecision = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AdminNote = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DisputeThreads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DisputeThreads_RefundRequests_RefundRequestId",
                        column: x => x.RefundRequestId,
                        principalTable: "RefundRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefundRequestItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefundRequestId = table.Column<long>(type: "bigint", nullable: false),
                    SubOrderItemId = table.Column<long>(type: "bigint", nullable: false),
                    QuantityToRefund = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundRequestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefundRequestItems_RefundRequests_RefundRequestId",
                        column: x => x.RefundRequestId,
                        principalTable: "RefundRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DisputeMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DisputeThreadId = table.Column<long>(type: "bigint", nullable: false),
                    SenderUserId = table.Column<long>(type: "bigint", nullable: false),
                    SenderRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    AttachmentUrlsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DisputeMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DisputeMessages_DisputeThreads_DisputeThreadId",
                        column: x => x.DisputeThreadId,
                        principalTable: "DisputeThreads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DisputeMessages_DisputeThreadId",
                table: "DisputeMessages",
                column: "DisputeThreadId");

            migrationBuilder.CreateIndex(
                name: "IX_DisputeThreads_RefundRequestId",
                table: "DisputeThreads",
                column: "RefundRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequestItems_RefundRequestId",
                table: "RefundRequestItems",
                column: "RefundRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DisputeMessages");

            migrationBuilder.DropTable(
                name: "RefundRequestItems");

            migrationBuilder.DropTable(
                name: "DisputeThreads");

            migrationBuilder.DropColumn(
                name: "AttemptCount",
                table: "RefundRequests");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "RefundRequests");

            migrationBuilder.DropColumn(
                name: "ExpirationDate",
                table: "RefundRequests");

            migrationBuilder.DropColumn(
                name: "ProofImagesJson",
                table: "RefundRequests");

            migrationBuilder.DropColumn(
                name: "SellerRejectReason",
                table: "RefundRequests");

            migrationBuilder.RenameColumn(
                name: "RequestedAmount",
                table: "RefundRequests",
                newName: "RefundAmount");

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "RefundRequests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<List<string>>(
                name: "Medias",
                table: "RefundRequests",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "SellerNote",
                table: "RefundRequests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_SubOrderId",
                table: "RefundRequests",
                column: "SubOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_RefundRequests_SubOrders_SubOrderId",
                table: "RefundRequests",
                column: "SubOrderId",
                principalTable: "SubOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
