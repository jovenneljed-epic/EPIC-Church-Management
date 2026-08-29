
using EPIC.Api.Models;

using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Data
{
    public static class ClientRoleSeeder
    {
        // =========================================================
        // DEFAULT MODULES
        // =========================================================

        private static readonly string[] DefaultModules =
        {
            "Dashboard",
            "Members",
            "Attendance",
            "Visitors",
            "Services",
            "Giving",
            "Income",
            "Expenses",
            "Ministries",
            "Events",
            "Reports",
            "Learning",
            "Settings",
            "ChurchProfile"
        };

        // =========================================================
        // SEED
        // =========================================================

        public static async Task SeedAsync(
            ApplicationDbContext context)
        {
            // =====================================================
            // LOAD CUSTOMERS
            // =====================================================

            var customers =
                await context.Customers
                    .AsNoTracking()
                    .Select(c => c.CustomerId)
                    .ToListAsync();

            if (!customers.Any())
            {
                return;
            }

            // =====================================================
            // DEFAULT SYSTEM ROLES
            // =====================================================

            var defaultRoles =
                new[]
                {
                    new
                    {
                        Name = "CLIENT_ADMIN",

                        Description =
                            "Full access to the customer's EPIC CMS."
                    },

                    new
                    {
                        Name = "CLIENT_STAFF",

                        Description =
                            "Administrative and operational access."
                    },

                    new
                    {
                        Name = "CLIENT_LEADER",

                        Description =
                            "Leadership access to ministry, events and attendance."
                    },

                    new
                    {
                        Name = "CLIENT_MEMBER",

                        Description =
                            "Limited personal member access."
                    }
                };

            // =====================================================
            // PROCESS EACH CUSTOMER
            // =====================================================

            foreach (var customerId in customers)
            {
                foreach (var defaultRole in defaultRoles)
                {
                    // =================================================
                    // FIND ROLE
                    // =================================================

                    var role =
                        await context.ClientRoles
                            .FirstOrDefaultAsync(r =>
                                r.CustomerId == customerId &&
                                r.RoleName == defaultRole.Name);

                    // =================================================
                    // CREATE ROLE IF MISSING
                    // =================================================

                    if (role == null)
                    {
                        role =
                            new ClientRole
                            {
                                CustomerId =
                                    customerId,

                                RoleName =
                                    defaultRole.Name,

                                Description =
                                    defaultRole.Description,

                                IsSystemRole =
                                    true,

                                IsActive =
                                    true,

                                CreatedDate =
                                    DateTime.UtcNow,

                                UpdatedDate =
                                    null
                            };

                        context.ClientRoles.Add(role);

                        await context.SaveChangesAsync();
                    }

                    // =================================================
                    // SEED PERMISSIONS
                    // =================================================

                    await SeedPermissionsAsync(
                        context,
                        role);
                }
            }
        }

        // =========================================================
        // PERMISSION SEEDER
        // =========================================================

        private static async Task SeedPermissionsAsync(
            ApplicationDbContext context,
            ClientRole role)
        {
            foreach (var moduleName in DefaultModules)
            {
                var permission =
                    await context.ClientPermissions
                        .FirstOrDefaultAsync(p =>
                            p.ClientRoleId ==
                                role.ClientRoleId &&

                            p.ModuleName == moduleName);

                // =================================================
                // DETERMINE DEFAULT PERMISSIONS
                // =================================================

                var defaults =
                    GetDefaultPermissions(
                        role.RoleName,
                        moduleName);

                // =================================================
                // CREATE
                // =================================================

                if (permission == null)
                {
                    context.ClientPermissions.Add(
                        new ClientPermission
                        {
                            ClientRoleId =
                                role.ClientRoleId,

                            ModuleName =
                                moduleName,

                            CanView =
                                defaults.CanView,

                            CanCreate =
                                defaults.CanCreate,

                            CanEdit =
                                defaults.CanEdit,

                            CanDelete =
                                defaults.CanDelete,

                            CanManage =
                                defaults.CanManage,

                            CreatedDate =
                                DateTime.UtcNow
                        });

                    continue;
                }

                // =================================================
                // DO NOT OVERWRITE EXISTING PERMISSIONS
                // =================================================
                //
                // This is important.
                //
                // If an administrator manually changes a role's
                // permissions, restarting the API must NOT reset
                // those permissions.
                // =================================================
            }

            await context.SaveChangesAsync();
        }

        // =========================================================
        // DEFAULT ROLE PERMISSIONS
        // =========================================================

        private static (
            bool CanView,
            bool CanCreate,
            bool CanEdit,
            bool CanDelete,
            bool CanManage)
            GetDefaultPermissions(
                string roleName,
                string moduleName)
        {
            var role =
                roleName.Trim()
                    .ToUpperInvariant();

            var module =
                moduleName.Trim()
                    .ToUpperInvariant();

            // =====================================================
            // CLIENT ADMIN
            // =====================================================
            //
            // Full access.
            // =====================================================

            if (role == "CLIENT_ADMIN")
            {
                return (
                    true,
                    true,
                    true,
                    true,
                    true);
            }

            // =====================================================
            // CLIENT STAFF
            // =====================================================

            if (role == "CLIENT_STAFF")
            {
                return module switch
                {
                    "DASHBOARD" =>
                        (true, false, false, false, false),

                    "MEMBERS" =>
                        (true, true, true, false, false),

                    "ATTENDANCE" =>
                        (true, true, true, false, false),

                    "VISITORS" =>
                        (true, true, true, false, false),

                    "SERVICES" =>
                        (true, true, true, false, false),

                    "GIVING" =>
                        (true, true, true, false, false),

                    "INCOME" =>
                        (true, true, true, false, false),

                    "EXPENSES" =>
                        (true, true, true, false, false),

                    "MINISTRIES" =>
                        (true, true, true, false, false),

                    "EVENTS" =>
                        (true, true, true, false, false),

                    "REPORTS" =>
                        (true, false, false, false, false),

                    "LEARNING" =>
                        (true, false, false, false, false),

                    "CHURCHPROFILE" =>
                        (true, false, false, false, false),

                    "SETTINGS" =>
                        (true, false, false, false, false),

                    _ =>
                        (false, false, false, false, false)
                };
            }

            // =====================================================
            // CLIENT LEADER
            // =====================================================

            if (role == "CLIENT_LEADER")
            {
                return module switch
                {
                    "DASHBOARD" =>
                        (true, false, false, false, false),

                    "MEMBERS" =>
                        (true, false, false, false, false),

                    "ATTENDANCE" =>
                        (true, true, true, false, false),

                    "VISITORS" =>
                        (true, true, true, false, false),

                    "SERVICES" =>
                        (true, true, true, false, false),

                    "MINISTRIES" =>
                        (true, true, true, false, true),

                    "EVENTS" =>
                        (true, true, true, false, true),

                    "REPORTS" =>
                        (true, false, false, false, false),

                    "LEARNING" =>
                        (true, false, false, false, false),

                    "CHURCHPROFILE" =>
                        (true, false, false, false, false),

                    _ =>
                        (false, false, false, false, false)
                };
            }

            // =====================================================
            // CLIENT MEMBER
            // =====================================================

            if (role == "CLIENT_MEMBER")
            {
                return module switch
                {
                    "DASHBOARD" =>
                        (true, false, false, false, false),

                    "LEARNING" =>
                        (true, false, false, false, false),

                    "CHURCHPROFILE" =>
                        (true, false, false, false, false),

                    _ =>
                        (false, false, false, false, false)
                };
            }

            // =====================================================
            // UNKNOWN ROLE
            // =====================================================

            return (
                false,
                false,
                false,
                false,
                false);
        }
    }
}

