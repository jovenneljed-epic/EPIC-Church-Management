using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitorManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VisitorAttendances_ChurchServices_ChurchServiceId",
                table: "VisitorAttendances");

            migrationBuilder.DropIndex(
                name: "IX_VisitorAttendances_VisitorId",
                table: "VisitorAttendances");

            migrationBuilder.CreateIndex(
                name: "IX_Visitors_VisitorCode",
                table: "Visitors",
                column: "VisitorCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisitorAttendances_VisitorId_ChurchServiceId",
                table: "VisitorAttendances",
                columns: new[] { "VisitorId", "ChurchServiceId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_VisitorAttendances_ChurchServices_ChurchServiceId",
                table: "VisitorAttendances",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VisitorAttendances_ChurchServices_ChurchServiceId",
                table: "VisitorAttendances");

            migrationBuilder.DropIndex(
                name: "IX_Visitors_VisitorCode",
                table: "Visitors");

            migrationBuilder.DropIndex(
                name: "IX_VisitorAttendances_VisitorId_ChurchServiceId",
                table: "VisitorAttendances");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorAttendances_VisitorId",
                table: "VisitorAttendances",
                column: "VisitorId");

            migrationBuilder.AddForeignKey(
                name: "FK_VisitorAttendances_ChurchServices_ChurchServiceId",
                table: "VisitorAttendances",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
