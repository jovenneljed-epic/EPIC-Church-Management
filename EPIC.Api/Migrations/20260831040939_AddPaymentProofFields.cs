using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentProofFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentProofContentType",
                table: "Payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "PaymentProofData",
                table: "Payments",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentProofFileName",
                table: "Payments",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentProofUploadedDate",
                table: "Payments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentProofContentType",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentProofData",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentProofFileName",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentProofUploadedDate",
                table: "Payments");
        }
    }
}
