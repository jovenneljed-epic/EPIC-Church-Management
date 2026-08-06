using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncSettingsAndRoleModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // 1. CREATE CHURCH SETTINGS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "ChurchSettings",
                columns: table => new
                {
                    ChurchSettingsId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    ChurchName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    ChurchCode = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Address = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    ContactNumber = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Email = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    PastorName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    LogoPath = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    UpdatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_ChurchSettings",
                        x => x.ChurchSettingsId);
                });


            // =========================================================
            // 2. CREATE ROLES
            // =========================================================

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    RoleName = table.Column<string>(
                        type: "nvarchar(50)",
                        maxLength: 50,
                        nullable: false),

                    Description = table.Column<string>(
                        type: "nvarchar(250)",
                        maxLength: 250,
                        nullable: false),

                    IsActive = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CreatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_Roles",
                        x => x.RoleId);
                });


            // =========================================================
            // 3. CREATE DEFAULT ROLES
            // =========================================================

            migrationBuilder.Sql(@"
        INSERT INTO Roles
        (
            RoleName,
            Description,
            IsActive,
            CreatedDate
        )
        VALUES
        (
            'ADMIN',
            'Full system administrator',
            1,
            GETDATE()
        ),
        (
            'PASTOR',
            'Pastor / church leadership access',
            1,
            GETDATE()
        ),
        (
            'STAFF',
            'General staff access',
            1,
            GETDATE()
        );
    ");


            // =========================================================
            // 4. CREATE PERMISSIONS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    PermissionId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    RoleId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    Module = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false),

                    CanView = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CanCreate = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CanEdit = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CanDelete = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CanExport = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CreatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_Permissions",
                        x => x.PermissionId);

                    table.ForeignKey(
                        name: "FK_Permissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });


            // =========================================================
            // 5. CHANGE USERS USERNAME / FULLNAME
            // =========================================================

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "Users",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");


            // =========================================================
            // 6. ADD RoleId TEMPORARILY AS NULLABLE
            // =========================================================

            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "Users",
                type: "int",
                nullable: true);


            // =========================================================
            // 7. TRANSFER OLD USER ROLE → NEW ROLE ID
            // =========================================================

            migrationBuilder.Sql(@"
        UPDATE Users
        SET RoleId =
            CASE
                WHEN UPPER(LTRIM(RTRIM(Role))) = 'ADMIN'
                    THEN (SELECT RoleId FROM Roles WHERE RoleName = 'ADMIN')

                WHEN UPPER(LTRIM(RTRIM(Role))) = 'PASTOR'
                    THEN (SELECT RoleId FROM Roles WHERE RoleName = 'PASTOR')

                WHEN UPPER(LTRIM(RTRIM(Role))) = 'STAFF'
                    THEN (SELECT RoleId FROM Roles WHERE RoleName = 'STAFF')

                ELSE
                    (SELECT RoleId FROM Roles WHERE RoleName = 'STAFF')
            END;
    ");


            // =========================================================
            // 8. MAKE RoleId REQUIRED
            // =========================================================

            migrationBuilder.AlterColumn<int>(
                name: "RoleId",
                table: "Users",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);


            // =========================================================
            // 9. REMOVE OLD Role COLUMN
            // =========================================================

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");


            // =========================================================
            // 10. INDEXES
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_RoleId_Module",
                table: "Permissions",
                columns: new[]
                {
            "RoleId",
            "Module"
                },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_RoleName",
                table: "Roles",
                column: "RoleName",
                unique: true);


            // =========================================================
            // 11. USER → ROLE FOREIGN KEY
            // =========================================================

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "RoleId",
                onDelete: ReferentialAction.Restrict);
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "ChurchSettings");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_Users_RoleId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ContactNumber",
                table: "Ministries");

            migrationBuilder.DropColumn(
                name: "MeetingDay",
                table: "Ministries");

            migrationBuilder.DropColumn(
                name: "MeetingLocation",
                table: "Ministries");

            migrationBuilder.DropColumn(
                name: "MeetingTime",
                table: "Ministries");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
