using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientLearning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientCourseEnrollments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientMemberId = table.Column<int>(type: "int", nullable: false),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    EnrolledAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientCourseEnrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientCourseEnrollments_ClientMembers_ClientMemberId",
                        column: x => x.ClientMemberId,
                        principalTable: "ClientMembers",
                        principalColumn: "ClientMemberId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientCourseEnrollments_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "CourseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientLessonCompletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientCourseEnrollmentId = table.Column<int>(type: "int", nullable: false),
                    LessonId = table.Column<int>(type: "int", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientLessonCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientLessonCompletions_ClientCourseEnrollments_ClientCourseEnrollmentId",
                        column: x => x.ClientCourseEnrollmentId,
                        principalTable: "ClientCourseEnrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientCourseEnrollments_ClientMemberId_CourseId",
                table: "ClientCourseEnrollments",
                columns: new[] { "ClientMemberId", "CourseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientCourseEnrollments_CourseId",
                table: "ClientCourseEnrollments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientLessonCompletions_ClientCourseEnrollmentId_LessonId",
                table: "ClientLessonCompletions",
                columns: new[] { "ClientCourseEnrollmentId", "LessonId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientLessonCompletions");

            migrationBuilder.DropTable(
                name: "ClientCourseEnrollments");
        }
    }
}
