using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DemoRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ResendEmailService _emailService;

        private const string MODULE = "Demo Requests";

        public DemoRequestsController(
            ApplicationDbContext context,
            IPermissionService permissionService,
            ResendEmailService emailService)
        {
            _context = context;
            _permissionService = permissionService;
            _emailService = emailService;
        }

        // =========================================================
        // PUBLIC - SUBMIT DEMO REQUEST
        // POST: /api/DemoRequests
        // =========================================================

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDemoRequest(
            [FromBody] DemoRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            request.FullName =
                request.FullName.Trim();

            request.ChurchName =
                request.ChurchName.Trim();

            request.Email =
                request.Email.Trim().ToLower();

            if (!string.IsNullOrWhiteSpace(request.Phone))
            {
                request.Phone =
                    request.Phone.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Position))
            {
                request.Position =
                    request.Position.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Message))
            {
                request.Message =
                    request.Message.Trim();
            }

            // =====================================================
            // SYSTEM-CONTROLLED VALUES
            // =====================================================

            request.DemoRequestId = 0;

            request.Status = "Pending";

            request.AdminNotes = null;

            request.CreatedDate =
                DateTime.UtcNow;

            request.ContactedDate = null;

            request.DemoDate = null;

            // =====================================================
            // SAVE DEMO REQUEST
            // =====================================================

            _context.DemoRequests.Add(request);

            await _context.SaveChangesAsync();

            // =====================================================
            // SEND AUTOMATIC CONFIRMATION EMAIL
            //
            // The email service handles its own errors so a
            // temporary email failure will not prevent the demo
            // request from being saved successfully.
            // =====================================================

            await _emailService
                .SendDemoRequestConfirmationAsync(
                    request.FullName,
                    request.Email,
                    request.ChurchName
                );

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                success = true,

                message =
                    "Your demo request has been submitted successfully. " +
                    "Please check your email for confirmation. " +
                    "Our EPIC team will contact you soon. God bless you!",

                demoRequestId =
                    request.DemoRequestId
            });
        }


        // =========================================================
        // GET ALL DEMO REQUESTS
        // GET: /api/DemoRequests
        //
        // REQUIRES:
        // Demo Requests -> View
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetDemoRequests()
        {
            if (!await _permissionService.HasPermissionAsync(
                    User,
                    MODULE,
                    "view"))
            {
                return Forbid();
            }

            var requests =
                await _context.DemoRequests
                    .AsNoTracking()
                    .OrderByDescending(
                        x => x.CreatedDate)
                    .ToListAsync();

            return Ok(requests);
        }


        // =========================================================
        // GET SINGLE DEMO REQUEST
        // GET: /api/DemoRequests/{id}
        //
        // REQUIRES:
        // Demo Requests -> View
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDemoRequest(
            int id)
        {
            if (!await _permissionService.HasPermissionAsync(
                    User,
                    MODULE,
                    "view"))
            {
                return Forbid();
            }

            var request =
                await _context.DemoRequests
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x =>
                            x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message =
                        "Demo request not found."
                });
            }

            return Ok(request);
        }


        // =========================================================
        // UPDATE DEMO REQUEST
        // PUT: /api/DemoRequests/{id}
        //
        // REQUIRES:
        // Demo Requests -> Edit
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDemoRequest(
            int id,
            [FromBody] DemoRequest updatedRequest)
        {
            if (!await _permissionService.HasPermissionAsync(
                    User,
                    MODULE,
                    "edit"))
            {
                return Forbid();
            }

            var request =
                await _context.DemoRequests
                    .FirstOrDefaultAsync(
                        x =>
                            x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message =
                        "Demo request not found."
                });
            }

            var allowedStatuses =
                new[]
                {
                    "Pending",
                    "Contacted",
                    "Scheduled",
                    "Completed",
                    "Cancelled"
                };

            var status =
                string.IsNullOrWhiteSpace(
                    updatedRequest.Status)
                    ? request.Status
                    : updatedRequest.Status.Trim();

            if (!allowedStatuses.Contains(
                    status,
                    StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid demo request status.",

                    allowedStatuses
                });
            }

            request.Status = status;

            request.AdminNotes =
                string.IsNullOrWhiteSpace(
                    updatedRequest.AdminNotes)
                    ? null
                    : updatedRequest.AdminNotes.Trim();

            request.ContactedDate =
                updatedRequest.ContactedDate;

            request.DemoDate =
                updatedRequest.DemoDate;

            // Automatically set contacted date
            if (
                status.Equals(
                    "Contacted",
                    StringComparison.OrdinalIgnoreCase)
                &&
                request.ContactedDate == null
            )
            {
                request.ContactedDate =
                    DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Demo request updated successfully.",

                request
            });
        }


        // =========================================================
        // DELETE DEMO REQUEST
        // DELETE: /api/DemoRequests/{id}
        //
        // REQUIRES:
        // Demo Requests -> Delete
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDemoRequest(
            int id)
        {
            if (!await _permissionService.HasPermissionAsync(
                    User,
                    MODULE,
                    "delete"))
            {
                return Forbid();
            }

            var request =
                await _context.DemoRequests
                    .FirstOrDefaultAsync(
                        x =>
                            x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message =
                        "Demo request not found."
                });
            }

            _context.DemoRequests.Remove(request);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Demo request deleted successfully."
            });
        }


        // =========================================================
        // GET SUMMARY
        // GET: /api/DemoRequests/summary
        //
        // REQUIRES:
        // Demo Requests -> View
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            if (!await _permissionService.HasPermissionAsync(
                    User,
                    MODULE,
                    "view"))
            {
                return Forbid();
            }

            var total =
                await _context.DemoRequests
                    .CountAsync();

            var pending =
                await _context.DemoRequests
                    .CountAsync(
                        x =>
                            x.Status == "Pending");

            var contacted =
                await _context.DemoRequests
                    .CountAsync(
                        x =>
                            x.Status == "Contacted");

            var scheduled =
                await _context.DemoRequests
                    .CountAsync(
                        x =>
                            x.Status == "Scheduled");

            var completed =
                await _context.DemoRequests
                    .CountAsync(
                        x =>
                            x.Status == "Completed");

            var cancelled =
                await _context.DemoRequests
                    .CountAsync(
                        x =>
                            x.Status == "Cancelled");

            return Ok(new
            {
                total,
                pending,
                contacted,
                scheduled,
                completed,
                cancelled
            });
        }
    }
}