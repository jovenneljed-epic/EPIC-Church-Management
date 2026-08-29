
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "CLIENT")]
    public class ClientPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IClientPermissionService _permissionService;

        public ClientPermissionsController(
            ApplicationDbContext context,
            IClientPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // =========================================================
        // GET MY PERMISSIONS
        //
        // GET: api/ClientPermissions/my
        //
        // CLIENT ONLY
        //
        // Permission identity is taken ONLY from JWT.
        //
        // JWT
        //     ↓
        // clientMemberId
        // customerId
        // clientRoleId
        //     ↓
        // Validate ClientMember
        //     ↓
        // Validate ClientRole belongs to Customer
        //     ↓
        // Return ClientPermissions
        // =========================================================

        [HttpGet("my")]
        public async Task<IActionResult> GetMyPermissions()
        {
            // =====================================================
            // GET CLAIMS
            // =====================================================

            var clientMemberIdClaim =
                User.FindFirst("clientMemberId");

            var customerIdClaim =
                User.FindFirst("customerId")
                ?? User.FindFirst("CustomerId");

            var clientRoleIdClaim =
                User.FindFirst("clientRoleId");

            // =====================================================
            // VALIDATE CLIENT MEMBER ID
            // =====================================================

            if (clientMemberIdClaim == null ||
                !int.TryParse(
                    clientMemberIdClaim.Value,
                    out var clientMemberId) ||
                clientMemberId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT MEMBER TOKEN."
                });
            }

            // =====================================================
            // VALIDATE CUSTOMER ID
            // =====================================================

            if (customerIdClaim == null ||
                !int.TryParse(
                    customerIdClaim.Value,
                    out var customerId) ||
                customerId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CUSTOMER TOKEN."
                });
            }

            // =====================================================
            // VALIDATE CLIENT ROLE ID
            // =====================================================

            if (clientRoleIdClaim == null ||
                !int.TryParse(
                    clientRoleIdClaim.Value,
                    out var clientRoleId) ||
                clientRoleId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT ROLE TOKEN."
                });
            }

            // =====================================================
            // LOAD CLIENT MEMBER
            //
            // Never trust JWT claims alone.
            // Verify that the account still exists and that the
            // CustomerId and ClientRoleId still match the database.
            // =====================================================

            var clientMember =
                await _context.ClientMembers
                    .Include(cm => cm.ClientRole)
                    .Include(cm => cm.Customer)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cm =>
                        cm.ClientMemberId ==
                            clientMemberId);

            if (clientMember == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT NOT FOUND."
                });
            }

            // =====================================================
            // VERIFY CUSTOMER
            // =====================================================

            if (clientMember.CustomerId != customerId)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CUSTOMER ACCESS."
                });
            }

            // =====================================================
            // VERIFY CLIENT ROLE
            // =====================================================

            if (clientMember.ClientRoleId != clientRoleId)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT ROLE ACCESS."
                });
            }

            // =====================================================
            // CLIENT MEMBER STATUS
            // =====================================================

            if (!clientMember.IsActive ||
                !string.Equals(
                    clientMember.Status?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT IS NOT ACTIVE."
                });
            }

            // =====================================================
            // VALIDATE ROLE
            //
            // Ensures:
            //
            // ClientRole
            //     ↓
            // belongs to
            //     ↓
            // Customer
            // =====================================================

            var validRole =
                await _permissionService
                    .IsValidClientRoleAsync(
                        clientRoleId,
                        customerId);

            if (!validRole)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ROLE IS INVALID OR INACTIVE."
                });
            }

            // =====================================================
            // LOAD ROLE
            // =====================================================

            var clientRole =
                await _context.ClientRoles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(role =>
                        role.ClientRoleId ==
                            clientRoleId &&
                        role.CustomerId ==
                            customerId &&
                        role.IsActive);

            if (clientRole == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ROLE NOT FOUND."
                });
            }

            // =====================================================
            // LOAD PERMISSIONS
            // =====================================================

            var permissions =
                await _context.ClientPermissions
                    .AsNoTracking()
                    .Where(permission =>
                        permission.ClientRoleId ==
                            clientRoleId)
                    .OrderBy(permission =>
                        permission.ModuleName)
                    .Select(permission =>
                        new
                        {
                            clientPermissionId =
                                permission.ClientPermissionId,

                            moduleName =
                                permission.ModuleName,

                            canView =
                                permission.CanView,

                            canCreate =
                                permission.CanCreate,

                            canEdit =
                                permission.CanEdit,

                            canDelete =
                                permission.CanDelete,

                            canManage =
                                permission.CanManage
                        })
                    .ToListAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "CLIENT PERMISSIONS RETRIEVED SUCCESSFULLY.",

                clientMemberId =
                    clientMember.ClientMemberId,

                customerId =
                    customerId,

                clientRoleId =
                    clientRole.ClientRoleId,

                clientRoleName =
                    clientRole.RoleName,

                permissions =
                    permissions
            });
        }

        // =========================================================
        // CHECK SPECIFIC PERMISSION
        //
        // GET:
        //
        // api/ClientPermissions/check?
        //     moduleName=Members&
        //     permission=View
        //
        // CLIENT ONLY
        //
        // Examples:
        //
        // /api/ClientPermissions/check
        //     ?moduleName=Members
        //     &permission=View
        //
        // /api/ClientPermissions/check
        //     ?moduleName=Attendance
        //     &permission=Create
        // =========================================================

        [HttpGet("check")]
        public async Task<IActionResult> CheckPermission(
            [FromQuery] string moduleName,
            [FromQuery] string permission)
        {
            // =====================================================
            // VALIDATE INPUT
            // =====================================================

            if (string.IsNullOrWhiteSpace(moduleName))
            {
                return BadRequest(new
                {
                    message =
                        "MODULE NAME IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(permission))
            {
                return BadRequest(new
                {
                    message =
                        "PERMISSION IS REQUIRED."
                });
            }

            // =====================================================
            // GET JWT CLAIMS
            // =====================================================

            var clientMemberIdClaim =
                User.FindFirst("clientMemberId");

            var customerIdClaim =
                User.FindFirst("customerId")
                ?? User.FindFirst("CustomerId");

            var clientRoleIdClaim =
                User.FindFirst("clientRoleId");

            // =====================================================
            // PARSE CLIENT MEMBER ID
            // =====================================================

            if (clientMemberIdClaim == null ||
                !int.TryParse(
                    clientMemberIdClaim.Value,
                    out var clientMemberId) ||
                clientMemberId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT MEMBER TOKEN."
                });
            }

            // =====================================================
            // PARSE CUSTOMER ID
            // =====================================================

            if (customerIdClaim == null ||
                !int.TryParse(
                    customerIdClaim.Value,
                    out var customerId) ||
                customerId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CUSTOMER TOKEN."
                });
            }

            // =====================================================
            // PARSE CLIENT ROLE ID
            // =====================================================

            if (clientRoleIdClaim == null ||
                !int.TryParse(
                    clientRoleIdClaim.Value,
                    out var clientRoleId) ||
                clientRoleId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT ROLE TOKEN."
                });
            }

            // =====================================================
            // VERIFY CLIENT MEMBER
            // =====================================================

            var clientMember =
                await _context.ClientMembers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cm =>
                        cm.ClientMemberId ==
                            clientMemberId);

            if (clientMember == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT NOT FOUND."
                });
            }

            if (!clientMember.IsActive ||
                !string.Equals(
                    clientMember.Status?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT IS NOT ACTIVE."
                });
            }

            // =====================================================
            // VERIFY JWT MATCHES DATABASE
            // =====================================================

            if (clientMember.CustomerId != customerId ||
                clientMember.ClientRoleId != clientRoleId)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT ACCESS."
                });
            }

            // =====================================================
            // CHECK PERMISSION
            // =====================================================

            var allowed =
                await _permissionService
                    .HasPermissionAsync(
                        clientRoleId,
                        customerId,
                        moduleName,
                        permission);

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                clientMemberId =
                    clientMemberId,

                customerId =
                    customerId,

                clientRoleId =
                    clientRoleId,

                moduleName =
                    moduleName.Trim(),

                permission =
                    permission.Trim(),

                allowed =
                    allowed
            });
        }
    }
}

