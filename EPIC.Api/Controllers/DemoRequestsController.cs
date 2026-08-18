using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DemoRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DemoRequestsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // PUBLIC - CREATE DEMO REQUEST
        // =========================================================
        // POST /api/DemoRequests
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
                request.FullName?.Trim() ?? "";

            request.ChurchName =
                request.ChurchName?.Trim() ?? "";

            request.Email =
                request.Email?.Trim().ToLowerInvariant() ?? "";

            request.Phone =
                string.IsNullOrWhiteSpace(request.Phone)
                    ? null
                    : request.Phone.Trim();

            request.Position =
                string.IsNullOrWhiteSpace(request.Position)
                    ? null
                    : request.Position.Trim();

            request.Message =
                string.IsNullOrWhiteSpace(request.Message)
                    ? null
                    : request.Message.Trim();

            // Server-controlled fields
            request.DemoRequestId = 0;
            request.Status = "Pending";
            request.AdminNotes = null;
            request.CreatedDate = DateTime.UtcNow;
            request.ContactedDate = null;
            request.DemoDate = null;

            _context.DemoRequests.Add(request);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    "Your demo request has been submitted successfully. Our EPIC team will contact you soon. God bless you!",
                demoRequestId =
                    request.DemoRequestId
            });
        }

        // =========================================================
        // ADMIN - GET SUMMARY
        // =========================================================
        // GET /api/DemoRequests/summary
        //
        // IMPORTANT:
        // This route is declared BEFORE /{id:int}
        // =========================================================

        [HttpGet("summary")]
        [Authorize]
        public async Task<IActionResult> GetSummary()
        {
            var total =
                await _context.DemoRequests.CountAsync();

            var pending =
                await _context.DemoRequests.CountAsync(
                    x => x.Status == "Pending");

            var contacted =
                await _context.DemoRequests.CountAsync(
                    x => x.Status == "Contacted");

            var scheduled =
                await _context.DemoRequests.CountAsync(
                    x => x.Status == "Scheduled");

            var completed =
                await _context.DemoRequests.CountAsync(
                    x => x.Status == "Completed");

            var cancelled =
                await _context.DemoRequests.CountAsync(
                    x => x.Status == "Cancelled");

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

        // =========================================================
        // ADMIN - GET ALL DEMO REQUESTS
        // =========================================================
        // GET /api/DemoRequests
        // =========================================================

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDemoRequests()
        {
            var requests =
                await _context.DemoRequests
                    .AsNoTracking()
                    .OrderByDescending(
                        x => x.CreatedDate)
                    .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // ADMIN - GET SINGLE DEMO REQUEST
        // =========================================================
        // GET /api/DemoRequests/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetDemoRequest(
            int id)
        {
            var request =
                await _context.DemoRequests
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x => x.DemoRequestId == id);

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
        // ADMIN - UPDATE DEMO REQUEST
        // =========================================================
        // PUT /api/DemoRequests/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateDemoRequest(
            int id,
            [FromBody] DemoRequest updatedRequest)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var request =
                await _context.DemoRequests
                    .FirstOrDefaultAsync(
                        x => x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message =
                        "Demo request not found."
                });
            }

            // =====================================================
            // VALID STATUSES
            // =====================================================

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

            var validStatus =
                allowedStatuses.Any(
                    x => x.Equals(
                        status,
                        StringComparison.OrdinalIgnoreCase));

            if (!validStatus)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid demo request status.",

                    allowedStatuses
                });
            }

            // Normalize status
            status =
                allowedStatuses.First(
                    x => x.Equals(
                        status,
                        StringComparison.OrdinalIgnoreCase));

            // =====================================================
            // UPDATE STATUS
            // =====================================================

            request.Status = status;

            // =====================================================
            // UPDATE NOTES
            // =====================================================

            request.AdminNotes =
                string.IsNullOrWhiteSpace(
                    updatedRequest.AdminNotes)
                    ? null
                    : updatedRequest.AdminNotes.Trim();

            // =====================================================
            // UPDATE CONTACTED DATE
            // =====================================================

            request.ContactedDate =
                updatedRequest.ContactedDate;

            // =====================================================
            // UPDATE DEMO DATE
            // =====================================================

            request.DemoDate =
                updatedRequest.DemoDate;

            // =====================================================
            // AUTOMATIC CONTACTED DATE
            // =====================================================

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

            // =====================================================
            // AUTOMATIC SCHEDULED DATE
            // =====================================================

            if (
                status.Equals(
                    "Scheduled",
                    StringComparison.OrdinalIgnoreCase)
                &&
                request.DemoDate == null
            )
            {
                return BadRequest(new
                {
                    message =
                        "Please provide a scheduled demo date."
                });
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
        // ADMIN - DELETE DEMO REQUEST
        // =========================================================
        // DELETE /api/DemoRequests/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteDemoRequest(
            int id)
        {
            var request =
                await _context.DemoRequests
                    .FirstOrDefaultAsync(
                        x => x.DemoRequestId == id);

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
    }
}