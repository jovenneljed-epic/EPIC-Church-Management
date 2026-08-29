using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientRoleAndPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =====================================================
            // 1. CREATE CLIENT ROLES
            // =====================================================

            migrationBuilder.CreateTable(
                name: "ClientRoles",
                columns: table => new
                {
                    ClientRoleId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    CustomerId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    RoleName = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false),

                    Description = table.Column<string>(
                        type: "nvarchar(500)",
                        maxLength: 500,
                        nullable: true),

                    IsSystemRole = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    IsActive = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: true),

                    CreatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    UpdatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_ClientRoles",
                        x => x.ClientRoleId);

                    table.ForeignKey(
                        name: "FK_ClientRoles_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Restrict);
                });

            // =====================================================
            // 2. CREATE CLIENT PERMISSIONS
            // =====================================================

            migrationBuilder.CreateTable(
                name: "ClientPermissions",
                columns: table => new
                {
                    ClientPermissionId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    ClientRoleId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    ModuleName = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false),

                    CanView = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    CanCreate = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    CanEdit = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    CanDelete = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    CanManage = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: false),

                    CreatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_ClientPermissions",
                        x => x.ClientPermissionId);

                    table.ForeignKey(
                        name: "FK_ClientPermissions_ClientRoles_ClientRoleId",
                        column: x => x.ClientRoleId,
                        principalTable: "ClientRoles",
                        principalColumn: "ClientRoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            // =====================================================
            // 3. CREATE DEFAULT CLIENT ADMIN ROLE
            //    FOR EVERY EXISTING CUSTOMER
            // =====================================================

            migrationBuilder.Sql(@"
                INSERT INTO ClientRoles
                (
                    CustomerId,
                    RoleName,
                    Description,
                    IsSystemRole,
                    IsActive,
                    CreatedDate
                )
                SELECT
                    CustomerId,
                    'CLIENT ADMIN',
                    'Default administrative role for existing client members.',
                    1,
                    1,
                    SYSUTCDATETIME()
                FROM Customers;
            ");

            // =====================================================
            // 4. ADD CLIENT ROLE COLUMN AS NULLABLE FIRST
            // =====================================================

            migrationBuilder.AddColumn<int>(
                name: "ClientRoleId",
                table: "ClientMembers",
                type: "int",
                nullable: true);

            // =====================================================
            // 5. ASSIGN EACH EXISTING CLIENT MEMBER
            //    TO ITS CUSTOMER'S CLIENT ADMIN ROLE
            // =====================================================

            migrationBuilder.Sql(@"
                UPDATE cm
                SET cm.ClientRoleId = cr.ClientRoleId
                FROM ClientMembers cm
                INNER JOIN ClientRoles cr
                    ON cm.CustomerId = cr.CustomerId
                WHERE cr.RoleName = 'CLIENT ADMIN'
                    AND cm.ClientRoleId IS NULL;
            ");

            // =====================================================
            // 6. MAKE CLIENT ROLE REQUIRED
            // =====================================================

            migrationBuilder.AlterColumn<int>(
                name: "ClientRoleId",
                table: "ClientMembers",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // =====================================================
            // 7. INDEXES
            // =====================================================

            migrationBuilder.CreateIndex(
                name: "IX_ClientMembers_ClientRoleId",
                table: "ClientMembers",
                column: "ClientRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPermissions_ClientRoleId_ModuleName",
                table: "ClientPermissions",
                columns: new[]
                {
                    "ClientRoleId",
                    "ModuleName"
                },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientRoles_CustomerId",
                table: "ClientRoles",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientRoles_CustomerId_RoleName",
                table: "ClientRoles",
                columns: new[]
                {
                    "CustomerId",
                    "RoleName"
                },
                unique: true);

            // =====================================================
            // 8. FOREIGN KEY
            // =====================================================

            migrationBuilder.AddForeignKey(
                name: "FK_ClientMembers_ClientRoles_ClientRoleId",
                table: "ClientMembers",
                column: "ClientRoleId",
                principalTable: "ClientRoles",
                principalColumn: "ClientRoleId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClientMembers_ClientRoles_ClientRoleId",
                table: "ClientMembers");

            migrationBuilder.DropIndex(
                name: "IX_ClientMembers_ClientRoleId",
                table: "ClientMembers");

            migrationBuilder.DropColumn(
                name: "ClientRoleId",
                table: "ClientMembers");

            migrationBuilder.DropTable(
                name: "ClientPermissions");

            migrationBuilder.DropTable(
                name: "ClientRoles");
        }
    }
}