using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitorAttendanceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisitorAttendances",
                columns: table => new
                {
                    VisitorAttendanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VisitorId = table.Column<int>(type: "int", nullable: false),
                    ChurchServiceId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RecordedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RecordedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitorAttendances", x => x.VisitorAttendanceId);
                    table.ForeignKey(
                        name: "FK_VisitorAttendances_ChurchServices_ChurchServiceId",
                        column: x => x.ChurchServiceId,
                        principalTable: "ChurchServices",
                        principalColumn: "ChurchServiceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitorAttendances_Visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "Visitors",
                        principalColumn: "VisitorId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisitorAttendances_ChurchServiceId",
                table: "VisitorAttendances",
                column: "ChurchServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorAttendances_VisitorId",
                table: "VisitorAttendances",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisitorAttendances");
        }
    }
}
