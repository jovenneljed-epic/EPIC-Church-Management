using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGivingTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Givings",
                columns: table => new
                {
                    GivingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: true),
                    ChurchServiceId = table.Column<int>(type: "int", nullable: true),
                    GivingType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GivingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RecordedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RecordedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Givings", x => x.GivingId);
                    table.ForeignKey(
                        name: "FK_Givings_ChurchServices_ChurchServiceId",
                        column: x => x.ChurchServiceId,
                        principalTable: "ChurchServices",
                        principalColumn: "ChurchServiceId");
                    table.ForeignKey(
                        name: "FK_Givings_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Givings_ChurchServiceId",
                table: "Givings",
                column: "ChurchServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Givings_MemberId",
                table: "Givings",
                column: "MemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Givings");
        }
    }
}
