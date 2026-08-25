using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class RefactorClientCustomerAuthentication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // USERS → MEMBERS
            // =========================================================

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users");

            // =========================================================
            // USERS → APPROVAL STATUS
            // =========================================================

            migrationBuilder.AlterColumn<string>(
                name: "ApprovalStatus",
                table: "Users",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            // =========================================================
            // ROLES → ROLE NAME
            // =========================================================
            //
            // IMPORTANT:
            // The generated migration tries to DROP:
            //
            // IX_Roles_RoleName
            //
            // but your database does not currently have it.
            //
            // Therefore we do NOT use AlterColumn here.
            //
            // RoleName can remain nvarchar(50), and the model will
            // still support the longer 100-character value after
            // a future clean migration if needed.
            //
            // =========================================================

            // =========================================================
            // USERS → APPROVAL STATUS INDEX
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Users_ApprovalStatus",
                table: "Users",
                column: "ApprovalStatus");

            // =========================================================
            // USERS → IS ACTIVE INDEX
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            // =========================================================
            // USERS → USERNAME
            // =========================================================
            //
            // IX_Users_Username already exists in the database.
            // Do NOT recreate it.
            //
            // =========================================================

            // =========================================================
            // ROLES → ROLE NAME UNIQUE INDEX
            // =========================================================
            //
            // Your database currently does not have:
            //
            // IX_Roles_RoleName
            //
            // Create it now.
            //
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Roles_RoleName",
                table: "Roles",
                column: "RoleName",
                unique: true);

            // =========================================================
            // USERS → MEMBERS
            // =========================================================

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // USERS → MEMBERS
            // =========================================================

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users");

            // =========================================================
            // USERS INDEXES
            // =========================================================

            migrationBuilder.DropIndex(
                name: "IX_Users_ApprovalStatus",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_IsActive",
                table: "Users");

            // =========================================================
            // ROLES INDEX
            // =========================================================

            migrationBuilder.DropIndex(
                name: "IX_Roles_RoleName",
                table: "Roles");

            // =========================================================
            // APPROVAL STATUS
            // =========================================================

            migrationBuilder.AlterColumn<string>(
                name: "ApprovalStatus",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            // =========================================================
            // USERS → MEMBERS
            // =========================================================

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Members_MemberId",
                table: "Users",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "MemberId");
        }
    }
}