using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalStatusToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MemberId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_MemberId",
                table: "Users",
                column: "MemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_MemberId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MemberId",
                table: "Users");
        }
    }
}
