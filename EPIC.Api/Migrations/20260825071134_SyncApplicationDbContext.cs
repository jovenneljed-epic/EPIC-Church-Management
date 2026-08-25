using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncApplicationDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MinistryMembers_Members_MemberId",
                table: "MinistryMembers");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "MinistryMembers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ACTIVE",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "MinistryMembers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Position",
                table: "MinistryMembers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "MinistryMembers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.CreateIndex(
                name: "IX_MinistryMembers_MinistryId_MemberId",
                table: "MinistryMembers",
                columns: new[] { "MinistryId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_MinistryMembers_Status",
                table: "MinistryMembers",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_MinistryMembers_Members_MemberId",
                table: "MinistryMembers",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MinistryMembers_Members_MemberId",
                table: "MinistryMembers");

            migrationBuilder.DropIndex(
                name: "IX_MinistryMembers_MinistryId_MemberId",
                table: "MinistryMembers");

            migrationBuilder.DropIndex(
                name: "IX_MinistryMembers_Status",
                table: "MinistryMembers");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "MinistryMembers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValue: "ACTIVE");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "MinistryMembers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Position",
                table: "MinistryMembers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "MinistryMembers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MinistryMembers_Members_MemberId",
                table: "MinistryMembers",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
