using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ecommerce.Services.Orders.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Update_Metrics_To_Int_And_Voucher_Code_Unique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DisputeMessages");

            migrationBuilder.DropTable(
                name: "DisputeThreads");

            migrationBuilder.AlterColumn<int>(
                name: "Width",
                table: "SubOrderSagaStates",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Weight",
                table: "SubOrderSagaStates",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Length",
                table: "SubOrderSagaStates",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Height",
                table: "SubOrderSagaStates",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Width",
                table: "SubOrderItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "WeightInGrams",
                table: "SubOrderItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Length",
                table: "SubOrderItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<int>(
                name: "Height",
                table: "SubOrderItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_Code",
                table: "Vouchers",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vouchers_Code",
                table: "Vouchers");

            migrationBuilder.AlterColumn<double>(
                name: "Width",
                table: "SubOrderSagaStates",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Weight",
                table: "SubOrderSagaStates",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Length",
                table: "SubOrderSagaStates",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Height",
                table: "SubOrderSagaStates",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Width",
                table: "SubOrderItems",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "WeightInGrams",
                table: "SubOrderItems",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Length",
                table: "SubOrderItems",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<double>(
                name: "Height",
                table: "SubOrderItems",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "DisputeThreads",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefundRequestId = table.Column<long>(type: "bigint", nullable: false),
                    AdminNote = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeadlineDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ResolutionDecision = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ResolvedByAdminId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
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
                name: "DisputeMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AttachmentUrlsJson = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DisputeThreadId = table.Column<long>(type: "bigint", nullable: false),
                    SenderRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SenderUserId = table.Column<long>(type: "bigint", nullable: false)
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
        }
    }
}
