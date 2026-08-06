using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventBasedAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Members_MemberId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_MemberId",
                table: "Attendances");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_MemberId_ChurchServiceId",
                table: "Attendances",
                columns: new[] { "MemberId", "ChurchServiceId" },
                unique: true,
                filter: "[ChurchServiceId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Members_MemberId",
                table: "Attendances",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Members_MemberId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_MemberId_ChurchServiceId",
                table: "Attendances");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_MemberId",
                table: "Attendances",
                column: "MemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Members_MemberId",
                table: "Attendances",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
