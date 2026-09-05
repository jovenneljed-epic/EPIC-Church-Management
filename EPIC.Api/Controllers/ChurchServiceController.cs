
using System.Security.Claims;

using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/ChurchServices")]
    [Authorize]
    public class ChurchServiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChurchServiceController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CURRENT USER ID
        // =========================================================

        private int? CurrentUserId
        {
            get
            {
                var userId =
                    User.FindFirst("userId")?.Value
                    ??
                    User.FindFirst(
                        ClaimTypes.NameIdentifier)?.Value;

                return int.TryParse(
                    userId,
                    out var id) &&
                    id > 0
                        ? id
                        : null;
            }
        }

        // =========================================================
        // CURRENT ROLE
        // =========================================================

        private string CurrentRole
        {
            get
            {
                var role =
                    User.FindFirst(
                        ClaimTypes.Role)?.Value
                    ??
                    User.FindFirst(
                        "role")?.Value;

                return string.IsNullOrWhiteSpace(role)
                    ? string.Empty
                    : role.Trim().ToUpperInvariant();
            }
        }

        // =========================================================
        // CLIENT ROLE FAMILY
        //
        // CLIENT
        // CLIENT_ADMIN
        // CLIENT_MANAGER
        // CLIENT_STAFF
        // CLIENT_*
        // =========================================================

        private bool IsClientRole
        {
            get
            {
                return
                    CurrentRole == "CLIENT" ||
                    CurrentRole.StartsWith("CLIENT_");
            }
        }
        private bool IsInternalChurchRole
        {
            get
            {
                return
                    CurrentRole == "ADMIN" ||
                    CurrentRole == "EPIC ASSISTANT PASTOR" ||
                    CurrentRole == "EPIC HEAD PASTOR" ||
                    CurrentRole == "EPIC ASSISTANT HEAD PASTOR";
            }
        }

        // =========================================================
        // CURRENT CLIENT MEMBER ID
        // =========================================================

        private int? CurrentClientMemberId
        {
            get
            {
                var value =
                    User.FindFirst(
                        "clientMemberId")?.Value;

                return int.TryParse(
                    value,
                    out var id) &&
                    id > 0
                        ? id
                        : null;
            }
        }

        // =========================================================
        // JWT CUSTOMER ID
        //
        // ADMIN FALLBACK ONLY
        // =========================================================

        private int? GetCustomerIdFromToken()
        {
            var value =
                User.FindFirst("customerId")?.Value
                ??
                User.FindFirst("CustomerId")?.Value
                ??
                User.FindFirst("tenantId")?.Value;

            return int.TryParse(
                value,
                out var id) &&
                id > 0
                    ? id
                    : null;
        }

        // =========================================================
        // GET CURRENT CUSTOMER ID
        // =========================================================

        private async Task<int?>
            GetCurrentCustomerIdAsync()
        {
            // =====================================================
            // CLIENT / CLIENT_*
            // =====================================================

            if (IsClientRole)
            {
                var clientMemberId =
                    CurrentClientMemberId;

                if (!clientMemberId.HasValue)
                {
                    return null;
                }

                var client =
                    await _context.ClientMembers
                        .AsNoTracking()
                        .Where(cm =>
                            cm.ClientMemberId ==
                                clientMemberId.Value &&

                            cm.IsActive &&

                            cm.Status != null &&

                            cm.Status.Trim().ToUpper() ==
                                "ACTIVE")
                        .Select(cm => new
                        {
                            CustomerId =
                                cm.CustomerId,

                            CustomerStatus =
                                cm.Customer != null
                                    ? cm.Customer.Status
                                    : null,

                            MemberStatus =
                                cm.Member != null
                                    ? cm.Member.Status
                                    : null,

                            ClientRoleActive =
                                cm.ClientRole != null &&
                                cm.ClientRole.IsActive
                        })
                        .FirstOrDefaultAsync();

                if (client == null)
                {
                    return null;
                }

                if (client.CustomerId <= 0)
                {
                    return null;
                }

                if (!string.Equals(
                    client.CustomerStatus?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!string.Equals(
                    client.MemberStatus?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!client.ClientRoleActive)
                {
                    return null;
                }

                return client.CustomerId;
            }
            // =====================================================
            // INTERNAL EPIC CHURCH ROLES
            // =====================================================

            if (IsInternalChurchRole)
            {
                var userId = CurrentUserId;

                if (userId.HasValue)
                {
                    var customerId =
                        await _context.Users
                            .AsNoTracking()
                            .Where(u =>
                                u.UserId == userId.Value)
                            .Select(u =>
                                u.CustomerId)
                            .FirstOrDefaultAsync();

                    if (customerId > 0)
                    {
                        return customerId;
                    }
                }

                // Fallback for internal EPIC staff accounts
                return 1;
            }
            // =====================================================
            // ADMIN
            // =====================================================

            if (CurrentRole == "ADMIN")
            {
                var userId =
                    CurrentUserId;

                if (userId.HasValue)
                {
                    var customerId =
                        await _context.Users
                            .AsNoTracking()
                            .Where(u =>
                                u.UserId ==
                                userId.Value)
                            .Select(u =>
                                u.CustomerId)
                            .FirstOrDefaultAsync();

                    if (customerId > 0)
                    {
                        return customerId;
                    }
                }

                return GetCustomerIdFromToken();
            }

            return null;
        }

        // =========================================================
        // REQUIRE CHURCH ACCESS
        // =========================================================

        private async Task<(
            IActionResult? Error,
            int? CustomerId)>
            RequireChurchAccessAsync()
        {
            // =====================================================
            // AUTHENTICATION
            // =====================================================

            if (User.Identity?.IsAuthenticated != true)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Authentication is required."
                    }),
                    null
                );
            }

            // =====================================================
            // ROLE
            // =====================================================

            var role =
                CurrentRole;

            if (!IsInternalChurchRole &&
      !IsClientRole)
            {
                return (
                    Forbid(),
                    null
                );
            }

            // =====================================================
            // CLIENT IDENTITY
            // =====================================================

            if (IsClientRole &&
                !CurrentClientMemberId.HasValue)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Client member identity could not be determined.",

                        role,

                        clientMemberId =
                            CurrentClientMemberId
                    }),
                    null
                );
            }

            // =====================================================
            // CUSTOMER
            // =====================================================

            var customerId =
                await GetCurrentCustomerIdAsync();

            if (!customerId.HasValue ||
                customerId.Value <= 0)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Customer identity could not be determined from the authenticated account.",

                        role,

                        userId =
                            CurrentUserId,

                        clientMemberId =
                            CurrentClientMemberId,

                        tokenCustomerId =
                            GetCustomerIdFromToken()
                    }),
                    null
                );
            }

            return (
                null,
                customerId.Value
            );
        }

        // =========================================================
        // CUSTOMER-SCOPED SERVICES
        // =========================================================

        private IQueryable<ChurchService>
            CustomerServices(
                int customerId)
        {
            return _context.ChurchServices
                .Where(s =>
                    s.CustomerId ==
                    customerId);
        }

        // =========================================================
        // GET ALL SERVICES
        //
        // GET:
        // /api/ChurchServices
        // =========================================================

        [HttpGet]
        public async Task<IActionResult>
            GetServices()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var services =
                    await CustomerServices(
                        customerId)
                        .AsNoTracking()
                        .OrderByDescending(
                            s => s.ServiceDate)
                        .ThenBy(
                            s => s.StartTime)
                        .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load church services.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // GET SERVICE BY ID
        //
        // GET:
        // /api/ChurchServices/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult>
            GetService(int id)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var service =
                    await CustomerServices(
                        customerId)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            s =>
                                s.ChurchServiceId ==
                                id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Church service not found.",

                        churchServiceId =
                            id,

                        customerId
                    });
                }

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load church service.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // PUBLIC UPCOMING CHURCH SERVICES
        //
        // GET:
        // /api/ChurchServices/public/upcoming
        //
        // PUBLIC WEBSITE ONLY
        // =========================================================

        [AllowAnonymous]
        [HttpGet("public/upcoming")]
        public async Task<IActionResult>
            GetPublicUpcomingServices()
        {
            try
            {
                // Main EPIC church / public website tenant
                const int publicCustomerId = 1;

                var today =
                    DateTime.Today;

                var services =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .Where(s =>
                            s.CustomerId == publicCustomerId &&

                            s.ServiceDate >= today &&

                            (
                                s.Status == null ||

                                s.Status.Trim().ToUpper() !=
                                "CANCELLED"
                            )
                        )
                        .OrderBy(s =>
                            s.ServiceDate)
                        .ThenBy(s =>
                            s.StartTime)
                        .Take(10)
                        .Select(s => new
                        {
                            churchServiceId =
                                s.ChurchServiceId,

                            serviceName =
                                s.ServiceName,

                            serviceType =
                                s.ServiceType,

                            serviceDate =
                                s.ServiceDate,

                            startTime =
                                s.StartTime,

                            endTime =
                                s.EndTime,

                            location =
                                s.Location,

                            serviceLeader =
                                s.ServiceLeader,

                            speaker =
                                s.Speaker,

                            description =
                                s.Description,

                            status =
                                s.Status
                        })
                        .ToListAsync();


                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load public upcoming church services.",

                        error =
                            ex.Message
                    }
                );
            }
        }

        // =========================================================
        // UPCOMING
        //
        // GET:
        // /api/ChurchServices/upcoming
        // =========================================================

        [HttpGet("upcoming")]
        public async Task<IActionResult>
            GetUpcomingServices()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var today =
                    DateTime.Today;

                var services =
                    await CustomerServices(
                        customerId)
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate >= today &&
                            (
                                s.Status == null ||
                                s.Status.Trim().ToUpper() !=
                                    "CANCELLED"
                            ))
                        .OrderBy(
                            s => s.ServiceDate)
                        .ThenBy(
                            s => s.StartTime)
                        .Take(10)
                        .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load upcoming church services.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // RECENT
        //
        // GET:
        // /api/ChurchServices/recent
        // =========================================================

        [HttpGet("recent")]
        public async Task<IActionResult>
            GetRecentServices()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var today =
                    DateTime.Today;

                var services =
                    await CustomerServices(
                        customerId)
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate < today)
                        .OrderByDescending(
                            s => s.ServiceDate)
                        .ThenByDescending(
                            s => s.StartTime)
                        .Take(10)
                        .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load recent church services.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // CREATE
        //
        // POST:
        // /api/ChurchServices
        // =========================================================

        [HttpPost]
        public async Task<IActionResult>
            CreateService(
                [FromBody] ChurchService service)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                if (service == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid church service data."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                    service.ServiceName))
                {
                    return BadRequest(new
                    {
                        message =
                            "Service name is required."
                    });
                }

                if (service.ServiceDate ==
                    default)
                {
                    return BadRequest(new
                    {
                        message =
                            "Service date is required."
                    });
                }

                // =================================================
                // NEVER TRUST CUSTOMER ID FROM REQUEST
                // =================================================

                service.CustomerId =
                    customerId;

                service.ServiceName =
                    service.ServiceName.Trim();

                service.ServiceType =
                    service.ServiceType?.Trim()
                    ?? string.Empty;

                service.StartTime =
                    service.StartTime?.Trim()
                    ?? string.Empty;

                service.EndTime =
                    service.EndTime?.Trim()
                    ?? string.Empty;

                service.Location =
                    service.Location?.Trim()
                    ?? string.Empty;

                service.ServiceLeader =
                    service.ServiceLeader?.Trim()
                    ?? string.Empty;

                service.Speaker =
                    service.Speaker?.Trim()
                    ?? string.Empty;

                service.Description =
                    service.Description?.Trim()
                    ?? string.Empty;

                service.Status =
                    string.IsNullOrWhiteSpace(
                        service.Status)
                        ? "SCHEDULED"
                        : service.Status
                            .Trim()
                            .ToUpperInvariant();

                service.CreatedDate =
                    DateTime.Now;

                service.UpdatedDate =
                    null;

                _context.ChurchServices.Add(
                    service);

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetService),
                    new
                    {
                        id =
                            service.ChurchServiceId
                    },
                    service);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to create church service because the database rejected the operation.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to create church service.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // UPDATE
        //
        // PUT:
        // /api/ChurchServices/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult>
            UpdateService(
                int id,
                [FromBody] ChurchService updatedService)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                if (updatedService == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid church service data."
                    });
                }

                var service =
                    await CustomerServices(
                        customerId)
                        .FirstOrDefaultAsync(
                            s =>
                                s.ChurchServiceId ==
                                id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Church service not found.",

                        churchServiceId =
                            id
                    });
                }

                if (string.IsNullOrWhiteSpace(
                    updatedService.ServiceName))
                {
                    return BadRequest(new
                    {
                        message =
                            "Service name is required."
                    });
                }

                if (updatedService.ServiceDate ==
                    default)
                {
                    return BadRequest(new
                    {
                        message =
                            "Service date is required."
                    });
                }

                service.ServiceName =
                    updatedService.ServiceName.Trim();

                service.ServiceType =
                    updatedService.ServiceType?.Trim()
                    ?? string.Empty;

                service.ServiceDate =
                    updatedService.ServiceDate;

                service.StartTime =
                    updatedService.StartTime?.Trim()
                    ?? string.Empty;

                service.EndTime =
                    updatedService.EndTime?.Trim()
                    ?? string.Empty;

                service.Location =
                    updatedService.Location?.Trim()
                    ?? string.Empty;

                service.ServiceLeader =
                    updatedService.ServiceLeader?.Trim()
                    ?? string.Empty;

                service.Speaker =
                    updatedService.Speaker?.Trim()
                    ?? string.Empty;

                service.Description =
                    updatedService.Description?.Trim()
                    ?? string.Empty;

                service.Status =
                    string.IsNullOrWhiteSpace(
                        updatedService.Status)
                        ? "SCHEDULED"
                        : updatedService.Status
                            .Trim()
                            .ToUpperInvariant();

                // =================================================
                // TENANT CANNOT BE CHANGED
                // =================================================

                service.CustomerId =
                    customerId;

                service.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(service);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to update church service because the database rejected the operation.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to update church service.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // UPDATE STATUS
        //
        // PATCH:
        // /api/ChurchServices/{id}/status
        // =========================================================

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult>
            UpdateStatus(
                int id,
                [FromBody] StatusRequest request)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                if (request == null ||
                    string.IsNullOrWhiteSpace(
                        request.Status))
                {
                    return BadRequest(new
                    {
                        message =
                            "Status is required."
                    });
                }

                var service =
                    await CustomerServices(
                        customerId)
                        .FirstOrDefaultAsync(
                            s =>
                                s.ChurchServiceId ==
                                id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Church service not found.",

                        churchServiceId =
                            id
                    });
                }

                service.Status =
                    request.Status
                        .Trim()
                        .ToUpperInvariant();

                service.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(service);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to update service status because the database rejected the operation.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to update service status.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }

        // =========================================================
        // DELETE
        //
        // DELETE:
        // /api/ChurchServices/{id}
        //
        // IMPORTANT:
        //
        // Attendance records referencing this service are deleted
        // FIRST to prevent FK constraint failures.
        //
        // Only attendance belonging to this ChurchServiceId is
        // removed.
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeleteService(int id)
        {
            try
            {
                // =================================================
                // ACCESS
                // =================================================

                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                // =================================================
                // FIND SERVICE
                //
                // CUSTOMER SCOPED
                // =================================================

                var service =
                    await CustomerServices(
                        customerId)
                        .FirstOrDefaultAsync(
                            s =>
                                s.ChurchServiceId ==
                                id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Church service not found.",

                        churchServiceId =
                            id
                    });
                }

                // =================================================
                // FIND ATTENDANCE
                //
                // We only select Attendance records linked to
                // this exact ChurchServiceId.
                //
                // =================================================

                var attendanceRecords =
                    await _context.Attendances
                        .Where(a =>
                            a.ChurchServiceId ==
                            id)
                        .ToListAsync();

                // =================================================
                // DELETE ATTENDANCE FIRST
                // =================================================

                if (attendanceRecords.Count > 0)
                {
                    _context.Attendances.RemoveRange(
                        attendanceRecords);
                }

                // =================================================
                // DELETE CHURCH SERVICE
                // =================================================

                _context.ChurchServices.Remove(
                    service);

                // =================================================
                // SAVE IN ONE TRANSACTION
                // =================================================

                await _context.SaveChangesAsync();

                // =================================================
                // RESPONSE
                // =================================================

                return Ok(new
                {
                    message =
                        "Church service deleted successfully.",

                    churchServiceId =
                        id,

                    deletedAttendanceRecords =
                        attendanceRecords.Count
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "The church service could not be deleted because it is still referenced by related database records.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to delete church service.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message,

                        exceptionType =
                            ex.GetType().FullName
                    });
            }
        }
    }

    // =============================================================
    // STATUS REQUEST
    // =============================================================

    public class StatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }
}

