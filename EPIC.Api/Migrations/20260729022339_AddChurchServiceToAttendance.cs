using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChurchServiceToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChurchServiceId",
                table: "Attendances",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_ChurchServiceId",
                table: "Attendances",
                column: "ChurchServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_ChurchServices_ChurchServiceId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_ChurchServiceId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "ChurchServiceId",
                table: "Attendances");
        }
    }
}
