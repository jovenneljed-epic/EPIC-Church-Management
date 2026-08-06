using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGivingManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Givings_ChurchServices_ChurchServiceId",
                table: "Givings");

            migrationBuilder.DropForeignKey(
                name: "FK_Givings_Members_MemberId",
                table: "Givings");

            migrationBuilder.AddForeignKey(
                name: "FK_Givings_ChurchServices_ChurchServiceId",
                table: "Givings",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Givings_Members_MemberId",
                table: "Givings",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Givings_ChurchServices_ChurchServiceId",
                table: "Givings");

            migrationBuilder.DropForeignKey(
                name: "FK_Givings_Members_MemberId",
                table: "Givings");

            migrationBuilder.AddForeignKey(
                name: "FK_Givings_ChurchServices_ChurchServiceId",
                table: "Givings",
                column: "ChurchServiceId",
                principalTable: "ChurchServices",
                principalColumn: "ChurchServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Givings_Members_MemberId",
                table: "Givings",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId");
        }
    }
}
