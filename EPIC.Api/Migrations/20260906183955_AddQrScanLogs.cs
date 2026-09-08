using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddQrScanLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QrScanLogs",
                columns: table => new
                {
                    QrScanLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    ScanType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<int>(type: "int", nullable: true),
                    Result = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ScanDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QrScanLogs", x => x.QrScanLogId);
                    table.ForeignKey(
                        name: "FK_QrScanLogs_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QrScanLogs_MemberId",
                table: "QrScanLogs",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_QrScanLogs_ScanDate",
                table: "QrScanLogs",
                column: "ScanDate");

            migrationBuilder.CreateIndex(
                name: "IX_QrScanLogs_ScanType",
                table: "QrScanLogs",
                column: "ScanType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QrScanLogs");
        }
    }
}
