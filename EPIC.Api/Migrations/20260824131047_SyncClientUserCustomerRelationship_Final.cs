using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncClientUserCustomerRelationship_Final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // BASELINE / SYNC MIGRATION
            // =========================================================
            //
            // Users.CustomerId already exists in the database.
            //
            // Existing database objects:
            //   - Users.CustomerId
            //   - IX_Users_CustomerId
            //   - FK_Users_Customers_CustomerId
            //
            // Therefore, DO NOT recreate them here.
            //
            // This migration only synchronizes EF Core migration
            // history with the existing database schema.
            //
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty.
            //
            // The CustomerId column, index, and FK existed in the
            // database before this baseline migration was recorded.
            // Therefore, rolling this migration back must NOT delete
            // those existing database objects.
        }
    }
}