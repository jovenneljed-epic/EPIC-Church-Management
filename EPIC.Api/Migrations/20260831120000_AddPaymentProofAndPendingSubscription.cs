using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations;

public partial class AddPaymentProofAndPendingSubscription : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PaymentProofFileName", table: "Payments", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "PaymentProofContentType", table: "Payments", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<byte[]>(
            name: "PaymentProofData", table: "Payments", type: "varbinary(max)", nullable: true);
        migrationBuilder.AddColumn<DateTime>(
            name: "PaymentProofUploadedDate", table: "Payments", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaymentProofFileName", table: "Payments");
        migrationBuilder.DropColumn(name: "PaymentProofContentType", table: "Payments");
        migrationBuilder.DropColumn(name: "PaymentProofData", table: "Payments");
        migrationBuilder.DropColumn(name: "PaymentProofUploadedDate", table: "Payments");
    }
}
