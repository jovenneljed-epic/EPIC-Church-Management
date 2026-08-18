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
        // PUBLIC - SUBMIT DEMO REQUEST
        // =========================================================
        //
        // POST:
        // /api/DemoRequests
        //
        // This endpoint is intentionally PUBLIC.
        // The landing page does not require login.
        //
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


            // -----------------------------------------------------
            // Normalize values
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // Server-controlled fields
            // -----------------------------------------------------

            request.DemoRequestId = 0;

            request.Status = "Pending";

            request.AdminNotes = null;

            request.CreatedDate =
                DateTime.UtcNow;

            request.ContactedDate = null;

            request.DemoDate = null;


            // -----------------------------------------------------
            // Save
            // -----------------------------------------------------

            _context.DemoRequests.Add(request);

            await _context.SaveChangesAsync();


            // -----------------------------------------------------
            // Response
            // -----------------------------------------------------

            return Ok(new
            {
                success = true,

                message =
                    "Your demo request has been submitted to EPIC Admin successfully. Our Epic team will contact you soon.Godblessu",

                demoRequestId =
                    request.DemoRequestId
            });
        }


        // =========================================================
        // ADMIN - GET ALL DEMO REQUESTS
        // =========================================================
        //
        // GET:
        // /api/DemoRequests
        //
        // Requires authenticated user.
        //
        // =========================================================

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDemoRequests()
        {
            var requests =
                await _context.DemoRequests
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedDate)
                    .ToListAsync();

            return Ok(requests);
        }


        // =========================================================
        // ADMIN - GET SINGLE DEMO REQUEST
        // =========================================================
        //
        // GET:
        // /api/DemoRequests/{id}
        //
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
                    message = "Demo request not found."
                });
            }

            return Ok(request);
        }


        // =========================================================
        // ADMIN - UPDATE DEMO REQUEST
        // =========================================================
        //
        // PUT:
        // /api/DemoRequests/{id}
        //
        // Allows the admin to update:
        //
        // Status
        // AdminNotes
        // ContactedDate
        // DemoDate
        //
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
                    message = "Demo request not found."
                });
            }


            // -----------------------------------------------------
            // Validate status
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // Update status
            // -----------------------------------------------------

            request.Status =
                status;


            // -----------------------------------------------------
            // Update admin notes
            // -----------------------------------------------------

            request.AdminNotes =
                string.IsNullOrWhiteSpace(
                    updatedRequest.AdminNotes)
                    ? null
                    : updatedRequest.AdminNotes.Trim();


            // -----------------------------------------------------
            // Contacted date
            // -----------------------------------------------------

            request.ContactedDate =
                updatedRequest.ContactedDate;


            // -----------------------------------------------------
            // Demo date
            // -----------------------------------------------------

            request.DemoDate =
                updatedRequest.DemoDate;


            // -----------------------------------------------------
            // Automatic contacted date
            //
            // If admin changes status to Contacted and no
            // contacted date was supplied, automatically record it.
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // Save
            // -----------------------------------------------------

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
        //
        // DELETE:
        // /api/DemoRequests/{id}
        //
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
                    message = "Demo request not found."
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
        // ADMIN - GET REQUEST COUNTS
        // =========================================================
        //
        // GET:
        // /api/DemoRequests/summary
        //
        // Useful for the CMS dashboard.
        //
        // =========================================================

        [HttpGet("summary")]
        [Authorize]
        public async Task<IActionResult> GetSummary()
        {
            var total =
                await _context.DemoRequests
                    .CountAsync();


            var pending =
                await _context.DemoRequests
                    .CountAsync(
                        x => x.Status == "Pending");


            var contacted =
                await _context.DemoRequests
                    .CountAsync(
                        x => x.Status == "Contacted");


            var scheduled =
                await _context.DemoRequests
                    .CountAsync(
                        x => x.Status == "Scheduled");


            var completed =
                await _context.DemoRequests
                    .CountAsync(
                        x => x.Status == "Completed");


            var cancelled =
                await _context.DemoRequests
                    .CountAsync(
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
    }
}