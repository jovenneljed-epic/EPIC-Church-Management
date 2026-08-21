using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncEventAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // EVENT ASSIGNMENTS
            // =========================================================
            //
            // The EventAssignments table has already been synchronized
            // directly in the database.
            //
            // Current database schema:
            //
            // EventAssignmentId     int
            // EventId               int
            // EventDepartmentId     int NULL
            // EventRoleId           int NULL
            // MemberId              int NULL
            // RoleName              nvarchar(150) NULL
            // AssignedPerson        nvarchar(200) NULL
            // DepartmentName        nvarchar(150) NULL
            // AssignmentStatus      nvarchar(50) NOT NULL
            // Priority              nvarchar(50) NOT NULL
            // Notes                 nvarchar(max) NULL
            // CreatedAt             datetime2 NOT NULL
            // UpdatedAt             datetime2 NULL
            //
            // Therefore, no database changes are required here.
            // =========================================================
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // INTENTIONALLY EMPTY
            // =========================================================
            //
            // This migration only synchronizes EF migration history
            // with an already-correct database schema.
            //
            // Rolling it back must NOT modify or delete the existing
            // EventAssignments table or its data.
            // =========================================================
        }
    }
}