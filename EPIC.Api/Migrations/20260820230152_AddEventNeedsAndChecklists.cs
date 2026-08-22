using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventNeedsAndChecklists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // IMPORTANT
            // =========================================================
            // This migration ONLY adds EventNeeds and EventChecklists.
            //
            // Existing Event / EventRole / EventAssignment structures
            // are intentionally left untouched.
            //
            // This avoids conflicts with existing SQL Server:
            // - Foreign keys
            // - Default constraints
            // - Indexes
            // =========================================================


            // =========================================================
            // EVENT CHECKLISTS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "EventChecklists",
                columns: table => new
                {
                    EventChecklistId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    EventId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    TaskName = table.Column<string>(
                        type: "nvarchar(300)",
                        maxLength: 300,
                        nullable: false),

                    Description = table.Column<string>(
                        type: "nvarchar(1000)",
                        maxLength: 1000,
                        nullable: true),

                    Category = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: true),

                    AssignedMemberId = table.Column<int>(
                        type: "int",
                        nullable: true),

                    AssignedPerson = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: true),

                    Status = table.Column<string>(
                        type: "nvarchar(30)",
                        maxLength: 30,
                        nullable: false,
                        defaultValue: "PENDING"),

                    Priority = table.Column<string>(
                        type: "nvarchar(20)",
                        maxLength: 20,
                        nullable: false,
                        defaultValue: "NORMAL"),

                    SortOrder = table.Column<int>(
                        type: "int",
                        nullable: false,
                        defaultValue: 0),

                    DueDate = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    CompletedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    CompletedByMemberId = table.Column<int>(
                        type: "int",
                        nullable: true),

                    Notes = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: true),

                    CreatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    UpdatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_EventChecklists",
                        x => x.EventChecklistId);

                    table.ForeignKey(
                        name: "FK_EventChecklists_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);

                    table.ForeignKey(
                        name: "FK_EventChecklists_Members_AssignedMemberId",
                        column: x => x.AssignedMemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.NoAction);

                    table.ForeignKey(
                        name: "FK_EventChecklists_Members_CompletedByMemberId",
                        column: x => x.CompletedByMemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.NoAction);
                });


            // =========================================================
            // EVENT NEEDS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "EventNeeds",
                columns: table => new
                {
                    EventNeedId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    EventId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    NeedName = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: false),

                    Description = table.Column<string>(
                        type: "nvarchar(1000)",
                        maxLength: 1000,
                        nullable: true),

                    Category = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: true),

                    Quantity = table.Column<decimal>(
                        type: "decimal(18,2)",
                        nullable: false,
                        defaultValue: 1m),

                    Unit = table.Column<string>(
                        type: "nvarchar(50)",
                        maxLength: 50,
                        nullable: true),

                    ResponsiblePerson = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: true),

                    ResponsibleMemberId = table.Column<int>(
                        type: "int",
                        nullable: true),

                    Status = table.Column<string>(
                        type: "nvarchar(30)",
                        maxLength: 30,
                        nullable: false,
                        defaultValue: "PENDING"),

                    Priority = table.Column<string>(
                        type: "nvarchar(20)",
                        maxLength: 20,
                        nullable: false,
                        defaultValue: "NORMAL"),

                    Notes = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: true),

                    NeededBy = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    CreatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    UpdatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_EventNeeds",
                        x => x.EventNeedId);

                    table.ForeignKey(
                        name: "FK_EventNeeds_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);

                    table.ForeignKey(
                        name: "FK_EventNeeds_Members_ResponsibleMemberId",
                        column: x => x.ResponsibleMemberId,
                        principalTable: "Members",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.NoAction);
                });


            // =========================================================
            // EVENT CHECKLIST INDEXES
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_EventId",
                table: "EventChecklists",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_AssignedMemberId",
                table: "EventChecklists",
                column: "AssignedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_CompletedByMemberId",
                table: "EventChecklists",
                column: "CompletedByMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_Category",
                table: "EventChecklists",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_Status",
                table: "EventChecklists",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_Priority",
                table: "EventChecklists",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_EventChecklists_SortOrder",
                table: "EventChecklists",
                column: "SortOrder");


            // =========================================================
            // EVENT NEED INDEXES
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_EventNeeds_EventId",
                table: "EventNeeds",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventNeeds_ResponsibleMemberId",
                table: "EventNeeds",
                column: "ResponsibleMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventNeeds_Category",
                table: "EventNeeds",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_EventNeeds_Status",
                table: "EventNeeds",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EventNeeds_Priority",
                table: "EventNeeds",
                column: "Priority");
        }


        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // EVENT NEEDS
            // =========================================================

            migrationBuilder.DropTable(
                name: "EventNeeds");


            // =========================================================
            // EVENT CHECKLISTS
            // =========================================================

            migrationBuilder.DropTable(
                name: "EventChecklists");
        }
    }
}
