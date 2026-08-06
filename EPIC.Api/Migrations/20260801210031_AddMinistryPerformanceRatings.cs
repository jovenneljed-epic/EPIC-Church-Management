using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMinistryPerformanceRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MinistryPerformanceRatings",
                columns: table => new
                {
                    PerformanceRatingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MinistryMemberId = table.Column<int>(type: "int", nullable: false),
                    EvaluationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AttendanceRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    CommitmentRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    ParticipationRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    TeamworkRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    SpiritualGrowthRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    LeadershipRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    ResponsibilityRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    OverallRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    Strengths = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    AreasForImprovement = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Recommendations = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Evaluator = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MinistryPerformanceRatings", x => x.PerformanceRatingId);
                    table.ForeignKey(
                        name: "FK_MinistryPerformanceRatings_MinistryMembers_MinistryMemberId",
                        column: x => x.MinistryMemberId,
                        principalTable: "MinistryMembers",
                        principalColumn: "MinistryMemberId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MinistryPerformanceRatings_MinistryMemberId",
                table: "MinistryPerformanceRatings",
                column: "MinistryMemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MinistryPerformanceRatings");
        }
    }
}
