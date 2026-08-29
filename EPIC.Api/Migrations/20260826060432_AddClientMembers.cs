using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // CLIENT MEMBERS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "ClientMembers",
                columns: table => new
                {
                    ClientMemberId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    CustomerId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    MemberId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    Username = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false),

                    PasswordHash = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Status = table.Column<string>(
                        type: "nvarchar(30)",
                        maxLength: 30,
                        nullable: false,
                        defaultValue: "ACTIVE"),

                    IsActive = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: true),

                    CreatedDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    LastLoginDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    Email = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: true),

                    ContactNumber = table.Column<string>(
                        type: "nvarchar(20)",
                        maxLength: 20,
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_ClientMembers",
                        x => x.ClientMemberId);

                    table.ForeignKey(
                        name: "FK_ClientMembers_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Restrict);

                    table.ForeignKey(
                        name: "FK_ClientMembers_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Restrict);
                });

            // =========================================================
            // INDEXES
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_ClientMembers_CustomerId",
                table: "ClientMembers",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientMembers_MemberId",
                table: "ClientMembers",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientMembers_CustomerId_MemberId",
                table: "ClientMembers",
                columns: new[]
                {
                    "CustomerId",
                    "MemberId"
                },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientMembers");
        }
    }
}