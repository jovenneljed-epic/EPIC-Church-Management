
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncApplicationDbContext_Final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // SUBSCRIPTION PLANS
            // ============================================================

            // Add IncludesEvents only if it does not already exist.
            migrationBuilder.Sql(@"
                IF COL_LENGTH('SubscriptionPlans', 'IncludesEvents') IS NULL
                BEGIN
                    ALTER TABLE [SubscriptionPlans]
                    ADD [IncludesEvents] bit NOT NULL
                    CONSTRAINT [DF_SubscriptionPlans_IncludesEvents]
                    DEFAULT (1);
                END
            ");


            // ============================================================
            // INCOMES INDEXES
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Incomes_Category'
                    AND object_id = OBJECT_ID('Incomes')
                )
                BEGIN
                    CREATE INDEX [IX_Incomes_Category]
                    ON [Incomes] ([Category]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Incomes_CustomerId_IncomeDate'
                    AND object_id = OBJECT_ID('Incomes')
                )
                BEGIN
                    CREATE INDEX [IX_Incomes_CustomerId_IncomeDate]
                    ON [Incomes] ([CustomerId], [IncomeDate]);
                END
            ");


            // ============================================================
            // EXPENSES INDEX
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Expenses_CustomerId_ExpenseDate'
                    AND object_id = OBJECT_ID('Expenses')
                )
                BEGIN
                    CREATE INDEX [IX_Expenses_CustomerId_ExpenseDate]
                    ON [Expenses] ([CustomerId], [ExpenseDate]);
                END
            ");


            // ============================================================
            // EVENT SYSTEM INDEXES
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_EventRoles_EventDepartmentId_RoleName'
                    AND object_id = OBJECT_ID('EventRoles')
                )
                BEGIN
                    CREATE UNIQUE INDEX
                    [IX_EventRoles_EventDepartmentId_RoleName]
                    ON [EventRoles]
                    ([EventDepartmentId], [RoleName]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_EventNeeds_NeededBy'
                    AND object_id = OBJECT_ID('EventNeeds')
                )
                BEGIN
                    CREATE INDEX [IX_EventNeeds_NeededBy]
                    ON [EventNeeds] ([NeededBy]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_EventDepartments_EventId_DepartmentName'
                    AND object_id = OBJECT_ID('EventDepartments')
                )
                BEGIN
                    CREATE UNIQUE INDEX
                    [IX_EventDepartments_EventId_DepartmentName]
                    ON [EventDepartments]
                    ([EventId], [DepartmentName]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_EventChecklists_DueDate'
                    AND object_id = OBJECT_ID('EventChecklists')
                )
                BEGIN
                    CREATE INDEX [IX_EventChecklists_DueDate]
                    ON [EventChecklists] ([DueDate]);
                END
            ");


            // ============================================================
            // FOREIGN KEYS
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Attendances_ChurchServices_ChurchServiceId'
                )
                BEGIN
                    ALTER TABLE [Attendances]
                    ADD CONSTRAINT
                    [FK_Attendances_ChurchServices_ChurchServiceId]
                    FOREIGN KEY ([ChurchServiceId])
                    REFERENCES [ChurchServices] ([ChurchServiceId])
                    ON DELETE SET NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Attendances_Members_MemberId'
                )
                BEGIN
                    ALTER TABLE [Attendances]
                    ADD CONSTRAINT
                    [FK_Attendances_Members_MemberId]
                    FOREIGN KEY ([MemberId])
                    REFERENCES [Members] ([MemberId]);
                END
            ");


            // ============================================================
            // EVENT ASSIGNMENTS
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventAssignments_EventDepartments_EventDepartmentId'
                )
                BEGIN
                    ALTER TABLE [EventAssignments]
                    ADD CONSTRAINT
                    [FK_EventAssignments_EventDepartments_EventDepartmentId]
                    FOREIGN KEY ([EventDepartmentId])
                    REFERENCES [EventDepartments] ([EventDepartmentId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventAssignments_EventRoles'
                )
                BEGIN
                    ALTER TABLE [EventAssignments]
                    ADD CONSTRAINT
                    [FK_EventAssignments_EventRoles]
                    FOREIGN KEY ([EventRoleId])
                    REFERENCES [EventRoles] ([EventRoleId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventAssignments_Members_MemberId'
                )
                BEGIN
                    ALTER TABLE [EventAssignments]
                    ADD CONSTRAINT
                    [FK_EventAssignments_Members_MemberId]
                    FOREIGN KEY ([MemberId])
                    REFERENCES [Members] ([MemberId]);
                END
            ");


            // ============================================================
            // EVENT CHECKLISTS
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventChecklists_Members_AssignedMemberId'
                )
                BEGIN
                    ALTER TABLE [EventChecklists]
                    ADD CONSTRAINT
                    [FK_EventChecklists_Members_AssignedMemberId]
                    FOREIGN KEY ([AssignedMemberId])
                    REFERENCES [Members] ([MemberId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventChecklists_Members_CompletedByMemberId'
                )
                BEGIN
                    ALTER TABLE [EventChecklists]
                    ADD CONSTRAINT
                    [FK_EventChecklists_Members_CompletedByMemberId]
                    FOREIGN KEY ([CompletedByMemberId])
                    REFERENCES [Members] ([MemberId]);
                END
            ");


            // ============================================================
            // EVENT NEEDS
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventNeeds_Members_ResponsibleMemberId'
                )
                BEGIN
                    ALTER TABLE [EventNeeds]
                    ADD CONSTRAINT
                    [FK_EventNeeds_Members_ResponsibleMemberId]
                    FOREIGN KEY ([ResponsibleMemberId])
                    REFERENCES [Members] ([MemberId]);
                END
            ");


            // ============================================================
            // EVENT ROLES
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_EventRoles_EventDepartments'
                )
                BEGIN
                    ALTER TABLE [EventRoles]
                    ADD CONSTRAINT
                    [FK_EventRoles_EventDepartments]
                    FOREIGN KEY ([EventDepartmentId])
                    REFERENCES [EventDepartments] ([EventDepartmentId])
                    ON DELETE CASCADE;
                END
            ");


            // ============================================================
            // CUSTOMER FOREIGN KEYS
            // ============================================================

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Events_Customers_CustomerId'
                )
                BEGIN
                    ALTER TABLE [Events]
                    ADD CONSTRAINT
                    [FK_Events_Customers_CustomerId]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Expenses_Customers_CustomerId'
                )
                BEGIN
                    ALTER TABLE [Expenses]
                    ADD CONSTRAINT
                    [FK_Expenses_Customers_CustomerId]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Givings_Customers_CustomerId'
                )
                BEGIN
                    ALTER TABLE [Givings]
                    ADD CONSTRAINT
                    [FK_Givings_Customers_CustomerId]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Incomes_Customers_CustomerId'
                )
                BEGIN
                    ALTER TABLE [Incomes]
                    ADD CONSTRAINT
                    [FK_Incomes_Customers_CustomerId]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Ministries_Customers'
                )
                BEGIN
                    ALTER TABLE [Ministries]
                    ADD CONSTRAINT
                    [FK_Ministries_Customers]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_Visitors_Customers_CustomerId'
                )
                BEGIN
                    ALTER TABLE [Visitors]
                    ADD CONSTRAINT
                    [FK_Visitors_Customers_CustomerId]
                    FOREIGN KEY ([CustomerId])
                    REFERENCES [Customers] ([CustomerId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty.
            //
            // This migration synchronizes an existing database that has
            // already received several manual schema corrections.
            //
            // We do not automatically remove existing production data
            // or manually synchronized database objects.
        }
    }
}

