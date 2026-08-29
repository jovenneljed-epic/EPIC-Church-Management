
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Data
{
    /// <summary>
    /// Seeds the default permissions for all system client roles.
    ///
    /// Permission hierarchy:
    ///
    /// Customer
    ///    ↓
    /// ClientRole
    ///    ↓
    /// ClientPermission
    ///
    /// System roles:
    /// CLIENT_ADMIN
    /// CLIENT_STAFF
    /// CLIENT_LEADER
    /// CLIENT_MEMBER
    ///
    /// This seeder is safe to run every time the API starts.
    /// Existing permissions are not duplicated.
    /// </summary>
    public static class ClientPermissionSeeder
    {
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
            // PROCESS EACH CUSTOMER
            // =====================================================

            foreach (var customerId in customers)
            {
                await SeedCustomerPermissionsAsync(
                    context,
                    customerId);
            }

            await context.SaveChangesAsync();
        }

        // =========================================================
        // SEED CUSTOMER
        // =========================================================

        private static async Task SeedCustomerPermissionsAsync(
            ApplicationDbContext context,
            int customerId)
        {
            // =====================================================
            // LOAD SYSTEM ROLES
            // =====================================================

            var roles =
                await context.ClientRoles
                    .Where(r =>
                        r.CustomerId == customerId &&
                        r.IsSystemRole &&
                        r.IsActive)
                    .ToListAsync();

            if (!roles.Any())
            {
                return;
            }

            // =====================================================
            // MODULES
            // =====================================================

            var modules = new[]
            {
                "Dashboard",
                "ChurchProfile",
                "Members",
                "Attendance",
                "Visitors",
                "Services",
                "Events",
                "Giving",
                "Income",
                "Expenses",
                "Ministries",
                "Reports",
                "Learning",
                "Settings"
            };

            // =====================================================
            // PROCESS ROLES
            // =====================================================

            foreach (var role in roles)
            {
                var roleName =
                    role.RoleName.Trim().ToUpperInvariant();

                foreach (var module in modules)
                {
                    // =================================================
                    // CHECK EXISTING PERMISSION
                    // =================================================

                    var existing =
                        await context.ClientPermissions
                            .FirstOrDefaultAsync(p =>
                                p.ClientRoleId ==
                                    role.ClientRoleId &&
                                p.ModuleName == module);

                    // =================================================
                    // DO NOT DUPLICATE
                    // =================================================

                    if (existing != null)
                    {
                        continue;
                    }

                    // =================================================
                    // CREATE DEFAULT PERMISSION
                    // =================================================

                    var permission =
                        CreatePermission(
                            role.ClientRoleId,
                            roleName,
                            module);

                    context.ClientPermissions.Add(
                        permission);
                }
            }
        }

        // =========================================================
        // CREATE PERMISSION
        // =========================================================

        private static ClientPermission CreatePermission(
            int clientRoleId,
            string roleName,
            string moduleName)
        {
            var permission =
                new ClientPermission
                {
                    ClientRoleId =
                        clientRoleId,

                    ModuleName =
                        moduleName,

                    CanView =
                        false,

                    CanCreate =
                        false,

                    CanEdit =
                        false,

                    CanDelete =
                        false,

                    CanManage =
                        false,

                    CreatedDate =
                        DateTime.UtcNow
                };

            // =====================================================
            // CLIENT ADMIN
            // =====================================================

            if (roleName == "CLIENT_ADMIN")
            {
                permission.CanView = true;
                permission.CanCreate = true;
                permission.CanEdit = true;
                permission.CanDelete = true;
                permission.CanManage = true;

                return permission;
            }

            // =====================================================
            // CLIENT STAFF
            // =====================================================

            if (roleName == "CLIENT_STAFF")
            {
                permission.CanView = true;

                switch (moduleName)
                {
                    case "Dashboard":
                        break;

                    case "ChurchProfile":
                        permission.CanEdit = true;
                        break;

                    case "Members":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Attendance":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Visitors":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Services":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Events":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Giving":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Income":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Expenses":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Ministries":
                        permission.CanCreate = true;
                        permission.CanEdit = true;
                        break;

                    case "Reports":
                        break;

                    case "Learning":
                        break;

                    case "Settings":
                        permission.CanEdit = true;
                        break;
                }

                return permission;
            }

            // =====================================================
            // CLIENT LEADER
            // =====================================================

            if (roleName == "CLIENT_LEADER")
            {
                permission.CanView = true;

                switch (moduleName)
                {
                    case "Attendance":
                        permission.CanManage = true;
                        break;

                    case "Services":
                        permission.CanManage = true;
                        break;

                    case "Events":
                        permission.CanManage = true;
                        break;

                    case "Ministries":
                        permission.CanManage = true;
                        break;

                    case "Members":
                        permission.CanView = true;
                        break;

                    case "Reports":
                        permission.CanView = true;
                        break;

                    case "Learning":
                        permission.CanView = true;
                        break;
                }

                return permission;
            }

            // =====================================================
            // CLIENT MEMBER
            // =====================================================

            if (roleName == "CLIENT_MEMBER")
            {
                switch (moduleName)
                {
                    case "Dashboard":
                        permission.CanView = true;
                        break;

                    case "ChurchProfile":
                        permission.CanView = true;
                        break;

                    case "Learning":
                        permission.CanView = true;
                        break;

                    case "Services":
                        permission.CanView = true;
                        break;

                    case "Events":
                        permission.CanView = true;
                        break;

                    case "Attendance":
                        permission.CanView = true;
                        break;

                    case "Giving":
                        permission.CanView = true;
                        break;

                    case "Members":
                        permission.CanView = true;
                        break;
                }

                return permission;
            }

            // =====================================================
            // UNKNOWN ROLE
            // =====================================================

            return permission;
        }
    }
}

