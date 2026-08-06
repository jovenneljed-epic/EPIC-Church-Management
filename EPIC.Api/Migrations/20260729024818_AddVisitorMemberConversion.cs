using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitorMemberConversion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConversionDate",
                table: "Visitors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConvertedMemberId",
                table: "Visitors",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsConvertedToMember",
                table: "Visitors",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConversionDate",
                table: "Visitors");

            migrationBuilder.DropColumn(
                name: "ConvertedMemberId",
                table: "Visitors");

            migrationBuilder.DropColumn(
                name: "IsConvertedToMember",
                table: "Visitors");
        }
    }
}
