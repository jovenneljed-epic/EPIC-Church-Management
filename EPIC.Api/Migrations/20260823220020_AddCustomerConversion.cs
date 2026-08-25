using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerConversion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConvertedDate",
                table: "DemoRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "DemoRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsConverted",
                table: "DemoRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    CustomerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    DemoRequestId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.CustomerId);
                    table.ForeignKey(
                        name: "FK_Customers_DemoRequests_DemoRequestId",
                        column: x => x.DemoRequestId,
                        principalTable: "DemoRequests",
                        principalColumn: "DemoRequestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_CreatedDate",
                table: "Customers",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_DemoRequestId",
                table: "Customers",
                column: "DemoRequestId",
                unique: true,
                filter: "[DemoRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Email",
                table: "Customers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Status",
                table: "Customers",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropColumn(
                name: "ConvertedDate",
                table: "DemoRequests");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "DemoRequests");

            migrationBuilder.DropColumn(
                name: "IsConverted",
                table: "DemoRequests");
        }
    }
}
