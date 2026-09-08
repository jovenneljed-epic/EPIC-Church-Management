using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChurchCommunity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityBlocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    BlockedMemberId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityBlocks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityContent",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    Kind = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    SharedPostId = table.Column<int>(type: "int", nullable: true),
                    Photo = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReviewReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ClientRequestId = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityContent", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityReactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PostId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    Kind = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityReactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    ContentId = table.Column<int>(type: "int", nullable: false),
                    MemberId = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsResolved = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityReviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContentId = table.Column<int>(type: "int", nullable: false),
                    ReviewerUserId = table.Column<int>(type: "int", nullable: false),
                    Decision = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityReviews", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityBlocks_MemberId_BlockedMemberId",
                table: "CommunityBlocks",
                columns: new[] { "MemberId", "BlockedMemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityContent_CustomerId_Kind_Status_Id",
                table: "CommunityContent",
                columns: new[] { "CustomerId", "Kind", "Status", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityContent_MemberId_ClientRequestId",
                table: "CommunityContent",
                columns: new[] { "MemberId", "ClientRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityReactions_PostId_MemberId",
                table: "CommunityReactions",
                columns: new[] { "PostId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityReports_ContentId_MemberId",
                table: "CommunityReports",
                columns: new[] { "ContentId", "MemberId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityBlocks");

            migrationBuilder.DropTable(
                name: "CommunityContent");

            migrationBuilder.DropTable(
                name: "CommunityReactions");

            migrationBuilder.DropTable(
                name: "CommunityReports");

            migrationBuilder.DropTable(
                name: "CommunityReviews");
        }
    }
}
