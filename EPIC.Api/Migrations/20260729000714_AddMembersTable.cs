using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMembersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    MemberId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    MemberCode = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    FirstName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    MiddleName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    LastName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Gender = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    BirthDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    ContactNumber = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Address = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    CivilStatus = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Ministry = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    DateJoined = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    Status = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    PhotoPath = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

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
                        "PK_Members",
                        x => x.MemberId);
                });
        }

        /// <inheritdoc />
        protected override void Down(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Members");
        }
    }
}