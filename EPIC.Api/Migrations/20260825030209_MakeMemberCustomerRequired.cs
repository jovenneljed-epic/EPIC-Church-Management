using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeMemberCustomerRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_Customers_CustomerId",
                table: "Members");

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Members",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Members_Customers_CustomerId",
                table: "Members",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "CustomerId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_Customers_CustomerId",
                table: "Members");

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Members",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Members_Customers_CustomerId",
                table: "Members",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "CustomerId");
        }
    }
}