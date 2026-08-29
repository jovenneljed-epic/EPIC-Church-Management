using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class CheckCurrentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchServices_Customers_CustomerId",
                table: "ChurchServices");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ChurchServices",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "SCHEDULED",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_ChurchServices_CustomerId_ServiceDate",
                table: "ChurchServices",
                columns: new[] { "CustomerId", "ServiceDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ChurchServices_ServiceDate",
                table: "ChurchServices",
                column: "ServiceDate");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchServices_ServiceType",
                table: "ChurchServices",
                column: "ServiceType");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchServices_Status",
                table: "ChurchServices",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchServices_Customers_CustomerId",
                table: "ChurchServices",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "CustomerId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchServices_Customers_CustomerId",
                table: "ChurchServices");

            migrationBuilder.DropIndex(
                name: "IX_ChurchServices_CustomerId_ServiceDate",
                table: "ChurchServices");

            migrationBuilder.DropIndex(
                name: "IX_ChurchServices_ServiceDate",
                table: "ChurchServices");

            migrationBuilder.DropIndex(
                name: "IX_ChurchServices_ServiceType",
                table: "ChurchServices");

            migrationBuilder.DropIndex(
                name: "IX_ChurchServices_Status",
                table: "ChurchServices");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ChurchServices",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValue: "SCHEDULED");

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchServices_Customers_CustomerId",
                table: "ChurchServices",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "CustomerId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
