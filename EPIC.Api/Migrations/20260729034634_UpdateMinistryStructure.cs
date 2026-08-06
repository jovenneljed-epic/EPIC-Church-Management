using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    public partial class UpdateMinistryStructure : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =====================================================
            // PRESERVE EXISTING MINISTRY DATA
            // =====================================================

            // MinistryName -> Name
            migrationBuilder.RenameColumn(
                name: "MinistryName",
                table: "Ministries",
                newName: "Name");

            // LeaderName -> MinistryHead
            migrationBuilder.RenameColumn(
                name: "LeaderName",
                table: "Ministries",
                newName: "MinistryHead");


            // =====================================================
            // UPDATE COLUMN LENGTHS
            // =====================================================

            migrationBuilder.AlterColumn<string>(
                name: "MinistryCode",
                table: "Ministries",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Ministries",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Ministries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(250)",
                oldMaxLength: 250);


            // =====================================================
            // ADD ROLE TO MINISTRY MEMBERS
            // =====================================================

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "MinistryMembers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove Role
            migrationBuilder.DropColumn(
                name: "Role",
                table: "MinistryMembers");


            // Restore original column names
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Ministries",
                newName: "MinistryName");

            migrationBuilder.RenameColumn(
                name: "MinistryHead",
                table: "Ministries",
                newName: "LeaderName");


            // Restore original lengths
            migrationBuilder.AlterColumn<string>(
                name: "MinistryCode",
                table: "Ministries",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Ministries",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Ministries",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
               oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);
        }
    }
}