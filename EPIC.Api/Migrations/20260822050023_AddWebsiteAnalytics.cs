using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWebsiteAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WebsiteVisits",
                columns: table => new
                {
                    WebsiteVisitId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VisitorId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PagePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PageTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LandingPage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Referrer = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TrafficSource = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrafficMedium = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrafficCampaign = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UtmSource = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UtmMedium = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UtmCampaign = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UtmTerm = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UtmContent = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DeviceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Browser = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OperatingSystem = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ScreenResolution = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Region = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TimeOnPageSeconds = table.Column<int>(type: "int", nullable: true),
                    IsBounce = table.Column<bool>(type: "bit", nullable: false),
                    IsReturningVisitor = table.Column<bool>(type: "bit", nullable: false),
                    VisitedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastActivityAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Language = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TimeZone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebsiteVisits", x => x.WebsiteVisitId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_Country",
                table: "WebsiteVisits",
                column: "Country");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_DeviceType",
                table: "WebsiteVisits",
                column: "DeviceType");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_PagePath",
                table: "WebsiteVisits",
                column: "PagePath");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_SessionId",
                table: "WebsiteVisits",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_TrafficMedium",
                table: "WebsiteVisits",
                column: "TrafficMedium");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_TrafficSource",
                table: "WebsiteVisits",
                column: "TrafficSource");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_UtmCampaign",
                table: "WebsiteVisits",
                column: "UtmCampaign");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_VisitedAt",
                table: "WebsiteVisits",
                column: "VisitedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_VisitorId",
                table: "WebsiteVisits",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WebsiteVisits");
        }
    }
}
