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
        private const string MODULE = "Demo Requests";

        private static readonly string[] AllowedStatuses =
        {
            "Pending",
            "Contacted",
            "Scheduled",
            "Completed",
            "Cancelled"
        };

        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ResendEmailService _emailService;

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

            // =====================================================
            // NORMALIZE INPUT
            // =====================================================

            NormalizeDemoRequest(request);

            // =====================================================
            // SYSTEM-CONTROLLED VALUES
            // =====================================================

            request.DemoRequestId = 0;
            request.Status = "Pending";
            request.AdminNotes = null;
            request.CreatedDate = DateTime.UtcNow;
            request.ContactedDate = null;
            request.DemoDate = null;

            // Customer conversion fields
            request.IsConverted = false;
            request.CustomerId = null;
            request.ConvertedDate = null;

            // =====================================================
            // SAVE DEMO REQUEST FIRST
            // =====================================================

            _context.DemoRequests.Add(request);

            await _context.SaveChangesAsync();

            // =====================================================
            // SEND EMAILS (1 FOR STUDENT/REQUESTER, 1 FOR ADMIN)
            // =====================================================

            bool isAcademyEnrollment =
                (!string.IsNullOrWhiteSpace(request.ChurchName) && request.ChurchName.Contains("EPIC Academy", StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(request.Position) && request.Position.Contains("Academy", StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(request.Message) && request.Message.Contains("[EPIC ACADEMY ENROLLMENT APPLICATION]", StringComparison.OrdinalIgnoreCase));

            bool isContactInquiry =
                !isAcademyEnrollment && (
                    (!string.IsNullOrWhiteSpace(request.ChurchName) && (
                        request.ChurchName.Contains("Contact Inquiry", StringComparison.OrdinalIgnoreCase) ||
                        request.ChurchName.Contains("Website Contact", StringComparison.OrdinalIgnoreCase) ||
                        request.ChurchName.Contains("Website Inquiry", StringComparison.OrdinalIgnoreCase) ||
                        request.ChurchName.Contains("Contact", StringComparison.OrdinalIgnoreCase))) ||
                    (!string.IsNullOrWhiteSpace(request.Position) && (
                        request.Position.Contains("Inquiry", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Prayer", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Counseling", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Worship", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Baptism", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Giving", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Volunteer", StringComparison.OrdinalIgnoreCase) ||
                        request.Position.Contains("Ministry", StringComparison.OrdinalIgnoreCase))));

            string responseMessage;

            if (isAcademyEnrollment)
            {
                responseMessage =
                    "Your academy enrollment application has been recorded successfully. " +
                    "Please check your email for confirmation. " +
                    "Our discipleship team will contact you soon. God bless you!";

                string courseCode = "ACADEMY";
                string courseTitle = "Discipleship Course Track";
                if (!string.IsNullOrWhiteSpace(request.ChurchName))
                {
                    var clean = request.ChurchName.Replace("EPIC Academy - ", "").Trim();
                    if (clean.Contains(':'))
                    {
                        var parts = clean.Split(':', 2);
                        courseCode = parts[0].Trim();
                        courseTitle = parts[1].Trim();
                    }
                    else
                    {
                        courseTitle = clean;
                    }
                }

                // 1. Send confirmation email to the enrolled student
                try
                {
                    await _emailService.SendCourseEnrollmentStudentConfirmationAsync(
                        fullName: request.FullName,
                        studentEmail: request.Email,
                        courseCode: courseCode,
                        courseTitle: courseTitle,
                        cohort: "Selected Cohort",
                        memberStatus: request.Position ?? "Active Member",
                        mentorName: null,
                        referenceCode: $"EPIC-ENROLL-{request.DemoRequestId:D6}",
                        enrolledDate: request.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Student confirmation email sending failed: {ex.Message}");
                }

                // 2. Send notification email to admin
                try
                {
                    await _emailService.SendCourseEnrollmentAdminNotificationAsync(
                        fullName: request.FullName,
                        studentEmail: request.Email,
                        phone: request.Phone,
                        courseCode: courseCode,
                        courseTitle: courseTitle,
                        cohort: "Selected Cohort",
                        memberStatus: request.Position ?? "Active Member",
                        mentorName: null,
                        referenceCode: $"EPIC-ENROLL-{request.DemoRequestId:D6}",
                        enrolledDate: request.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Admin enrollment notification email sending failed: {ex.Message}");
                }
            }
            else if (isContactInquiry)
            {
                responseMessage =
                    "Thank you for reaching out! Your message has been received by our pastoral team and recorded in our database. " +
                    "Please check your email for confirmation.";

                var dept = string.IsNullOrWhiteSpace(request.Position)
                    ? "General Church Inquiry"
                    : request.Position;

                // 1. Send confirmation email to the person who contacted
                try
                {
                    await _emailService.SendContactInquirySenderConfirmationAsync(
                        fullName: request.FullName,
                        email: request.Email,
                        phone: request.Phone,
                        departmentOrSubject: dept,
                        messageText: request.Message ?? "No message text provided.",
                        inquiryId: request.DemoRequestId,
                        receivedDate: request.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Contact inquiry sender confirmation email sending failed: {ex.Message}");
                }

                // 2. Send notification email to admin
                try
                {
                    await _emailService.SendContactInquiryAdminNotificationAsync(
                        fullName: request.FullName,
                        email: request.Email,
                        phone: request.Phone,
                        departmentOrSubject: dept,
                        messageText: request.Message ?? "No message text provided.",
                        inquiryId: request.DemoRequestId,
                        receivedDate: request.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Admin contact inquiry notification email sending failed: {ex.Message}");
                }
            }
            else
            {
                responseMessage =
                    "Your demo request has been submitted successfully. " +
                    "Please check your email for confirmation. " +
                    "Our EPIC team will contact you soon. God bless you!";

                // Normal demo request emails
                try
                {
                    await _emailService.SendDemoRequestConfirmationAsync(
                        request.FullName,
                        request.Email,
                        request.ChurchName);
                }
                catch
                {
                    // Email failure should not invalidate saved record
                }

                try
                {
                    await _emailService.SendNewDemoRequestAdminNotificationAsync(
                        request.FullName,
                        request.Email,
                        request.ChurchName,
                        request.Phone,
                        request.Position,
                        request.Message,
                        request.DemoRequestId);
                }
                catch
                {
                    // Email failure should not invalidate saved record
                }
            }

            // =====================================================
            // SUCCESS
            // =====================================================

            return Ok(new
            {
                success = true,
                message = responseMessage,
                demoRequestId = request.DemoRequestId
            });
        }

        // =========================================================
        // GET ALL DEMO REQUESTS
        // GET: /api/DemoRequests
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetDemoRequests()
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var requests = await _context.DemoRequests
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // GET SINGLE DEMO REQUEST
        // GET: /api/DemoRequests/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDemoRequest(int id)
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var request = await _context.DemoRequests
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
        // UPDATE DEMO REQUEST
        // PUT: /api/DemoRequests/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDemoRequest(
            int id,
            [FromBody] DemoRequestUpdateDto updatedRequest)
        {
            if (!await HasPermissionAsync("edit"))
            {
                return Forbid();
            }

            // =====================================================
            // LOAD EXISTING RECORD
            // =====================================================

            var request = await _context.DemoRequests
                .FirstOrDefaultAsync(
                    x => x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Demo request not found."
                });
            }

            // =====================================================
            // VALIDATE STATUS
            // =====================================================

            var newStatus =
                string.IsNullOrWhiteSpace(updatedRequest.Status)
                    ? request.Status
                    : updatedRequest.Status.Trim();

            if (!AllowedStatuses.Contains(
                    newStatus,
                    StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Invalid demo request status.",
                    allowedStatuses = AllowedStatuses
                });
            }

            // Normalize status casing
            newStatus = AllowedStatuses.First(
                x => x.Equals(
                    newStatus,
                    StringComparison.OrdinalIgnoreCase));

            // =====================================================
            // CHECK STATUS CHANGE
            // =====================================================

            var oldStatus = request.Status;

            var statusChanged =
                !string.Equals(
                    oldStatus,
                    newStatus,
                    StringComparison.OrdinalIgnoreCase);

            // =====================================================
            // UPDATE STATUS
            // =====================================================

            request.Status = newStatus;

            // =====================================================
            // UPDATE ADMIN NOTES
            // =====================================================

            if (updatedRequest.AdminNotes != null)
            {
                request.AdminNotes =
                    string.IsNullOrWhiteSpace(
                        updatedRequest.AdminNotes)
                        ? null
                        : updatedRequest.AdminNotes.Trim();
            }

            // =====================================================
            // UPDATE CONTACTED DATE
            // =====================================================

            if (updatedRequest.ContactedDate.HasValue)
            {
                request.ContactedDate =
                    updatedRequest.ContactedDate;
            }

            // =====================================================
            // UPDATE DEMO DATE
            // =====================================================

            if (updatedRequest.DemoDate.HasValue)
            {
                request.DemoDate =
                    updatedRequest.DemoDate;
            }

            // =====================================================
            // AUTOMATICALLY SET CONTACTED DATE
            // =====================================================

            if (
                newStatus.Equals(
                    "Contacted",
                    StringComparison.OrdinalIgnoreCase)
                &&
                request.ContactedDate == null)
            {
                request.ContactedDate = DateTime.UtcNow;
            }

            // =====================================================
            // SAVE STATUS/DATA CHANGES FIRST
            // =====================================================

            await _context.SaveChangesAsync();

            // =====================================================
            // AUTOMATIC CUSTOMER CONVERSION
            //
            // When the demo request becomes Completed,
            // automatically create a Customer.
            // =====================================================

            Customer? customer = null;

            if (
                newStatus.Equals(
                    "Completed",
                    StringComparison.OrdinalIgnoreCase)
                &&
                !request.IsConverted)
            {
                customer = await ConvertDemoRequestToCustomerAsync(
                    request);

                if (customer != null)
                {
                    request.IsConverted = true;
                    request.CustomerId = customer.CustomerId;
                    request.ConvertedDate = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                }
            }

            // =====================================================
            // SEND STATUS EMAIL
            // =====================================================

            if (statusChanged)
            {
                try
                {
                    await SendStatusNotificationAsync(
                        newStatus,
                        request);
                }
                catch
                {
                    // Email failure should not invalidate
                    // the database update.
                }
            }

            // =====================================================
            // SUCCESS
            // =====================================================

            return Ok(new
            {
                success = true,

                message = customer != null
                    ? $"Demo request updated successfully. " +
                      $"Status changed from {oldStatus} to {newStatus}. " +
                      $"Customer account created successfully."
                    : statusChanged
                        ? $"Demo request updated successfully. " +
                          $"Status changed from {oldStatus} to {newStatus}."
                        : "Demo request updated successfully.",

                request,

                customer = customer == null
                    ? null
                    : new
                    {
                        customer.CustomerId,
                        customer.ChurchName,
                        customer.ContactPerson,
                        customer.Email,
                        customer.Phone,
                        customer.Status,
                        customer.CreatedDate
                    }
            });
        }

        // =========================================================
        // MANUALLY CONVERT DEMO REQUEST TO CUSTOMER
        //
        // POST: /api/DemoRequests/{id}/convert
        //
        // Useful if an admin wants to convert a request without
        // changing its status.
        // =========================================================

        [HttpPost("{id:int}/convert")]
        public async Task<IActionResult> ConvertToCustomer(int id)
        {
            if (!await HasPermissionAsync("edit"))
            {
                return Forbid();
            }

            var request = await _context.DemoRequests
                .FirstOrDefaultAsync(
                    x => x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Demo request not found."
                });
            }

            // =====================================================
            // ALREADY CONVERTED
            // =====================================================

            if (request.IsConverted &&
                request.CustomerId.HasValue)
            {
                var existingCustomer =
                    await _context.Customers
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            x => x.CustomerId ==
                                 request.CustomerId.Value);

                return Ok(new
                {
                    success = true,
                    alreadyConverted = true,
                    message = "This demo request has already been converted to a customer.",
                    customer = existingCustomer
                });
            }

            // =====================================================
            // CONVERT
            // =====================================================

            var customer = await ConvertDemoRequestToCustomerAsync(
                request);

            if (customer == null)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to convert this demo request to a customer."
                });
            }

            // =====================================================
            // UPDATE DEMO REQUEST
            // =====================================================

            request.IsConverted = true;
            request.CustomerId = customer.CustomerId;
            request.ConvertedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Demo request converted to customer successfully.",

                customer = new
                {
                    customer.CustomerId,
                    customer.ChurchName,
                    customer.ContactPerson,
                    customer.Email,
                    customer.Phone,
                    customer.Status,
                    customer.CreatedDate
                }
            });
        }

        // =========================================================
        // DELETE DEMO REQUEST
        // DELETE: /api/DemoRequests/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDemoRequest(
            int id)
        {
            if (!await HasPermissionAsync("delete"))
            {
                return Forbid();
            }

            var request = await _context.DemoRequests
                .FirstOrDefaultAsync(
                    x => x.DemoRequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Demo request not found."
                });
            }

            // =====================================================
            // PROTECT CONVERTED REQUESTS
            // =====================================================

            if (request.IsConverted)
            {
                return BadRequest(new
                {
                    message =
                        "This demo request has already been converted " +
                        "to a customer and cannot be deleted."
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
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var total =
                await _context.DemoRequests.CountAsync();

            var pending =
                await _context.DemoRequests
                    .CountAsync(x => x.Status == "Pending");

            var contacted =
                await _context.DemoRequests
                    .CountAsync(x => x.Status == "Contacted");

            var scheduled =
                await _context.DemoRequests
                    .CountAsync(x => x.Status == "Scheduled");

            var completed =
                await _context.DemoRequests
                    .CountAsync(x => x.Status == "Completed");

            var cancelled =
                await _context.DemoRequests
                    .CountAsync(x => x.Status == "Cancelled");

            var converted =
                await _context.DemoRequests
                    .CountAsync(x => x.IsConverted);

            var notConverted =
                await _context.DemoRequests
                    .CountAsync(x => !x.IsConverted);

            return Ok(new
            {
                total,
                pending,
                contacted,
                scheduled,
                completed,
                cancelled,
                converted,
                notConverted
            });
        }

        // =========================================================
        // GET CONVERTED DEMO REQUESTS
        // GET: /api/DemoRequests/converted
        // =========================================================

        [HttpGet("converted")]
        public async Task<IActionResult> GetConvertedDemoRequests()
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var requests = await _context.DemoRequests
                .AsNoTracking()
                .Where(x => x.IsConverted)
                .OrderByDescending(x => x.ConvertedDate)
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // HELPER - CONVERT DEMO REQUEST TO CUSTOMER
        // =========================================================

        private async Task<Customer?> ConvertDemoRequestToCustomerAsync(
            DemoRequest request)
        {
            // =====================================================
            // CHECK IF CUSTOMER ALREADY EXISTS
            //
            // Email is treated as the primary matching identifier.
            // =====================================================

            var existingCustomer =
                await _context.Customers
                    .FirstOrDefaultAsync(
                        x => x.Email == request.Email);

            if (existingCustomer != null)
            {
                return existingCustomer;
            }

            // =====================================================
            // CREATE CUSTOMER
            // =====================================================

            var customer = new Customer
            {
                ChurchName = request.ChurchName,
                ContactPerson = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Status = "Active",
                DemoRequestId = request.DemoRequestId,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = null
            };

            _context.Customers.Add(customer);

            await _context.SaveChangesAsync();

            return customer;
        }

        // =========================================================
        // HELPER - CHECK PERMISSION
        // =========================================================

        private async Task<bool> HasPermissionAsync(
            string action)
        {
            return await _permissionService
                .HasPermissionAsync(
                    User,
                    MODULE,
                    action);
        }

        // =========================================================
        // HELPER - NORMALIZE DEMO REQUEST INPUT
        // =========================================================

        private static void NormalizeDemoRequest(
            DemoRequest request)
        {
            request.FullName =
                request.FullName?.Trim()
                ?? string.Empty;

            request.ChurchName =
                request.ChurchName?.Trim()
                ?? string.Empty;

            request.Email =
                request.Email?.Trim()
                    .ToLowerInvariant()
                ?? string.Empty;

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
        }

        // =========================================================
        // HELPER - SEND STATUS EMAIL
        // =========================================================

        private async Task SendStatusNotificationAsync(
            string status,
            DemoRequest request)
        {
            switch (status.ToLowerInvariant())
            {
                // =================================================
                // CONTACTED
                // =================================================

                case "contacted":

                    await _emailService
                        .SendDemoRequestContactedAsync(
                            request.Email,
                            request.FullName,
                            request.ChurchName);

                    break;

                // =================================================
                // SCHEDULED
                // =================================================

                case "scheduled":

                    await _emailService
                        .SendDemoRequestScheduledAsync(
                            request.Email,
                            request.FullName,
                            request.ChurchName,
                            request.DemoDate);

                    break;

                // =================================================
                // COMPLETED
                // =================================================

                case "completed":

                    await _emailService
                        .SendDemoRequestCompletedAsync(
                            request.Email,
                            request.FullName,
                            request.ChurchName);

                    break;

                // =================================================
                // CANCELLED
                // =================================================

                case "cancelled":

                    await _emailService
                        .SendDemoRequestCancelledAsync(
                            request.Email,
                            request.FullName,
                            request.ChurchName);

                    break;

                // =================================================
                // PENDING
                // =================================================

                case "pending":

                default:

                    break;
            }
        }
    }

    // =============================================================
    // DTO FOR ADMIN UPDATE
    // =============================================================

    public class DemoRequestUpdateDto
    {
        public string? Status { get; set; }

        public DateTime? ContactedDate { get; set; }

        public DateTime? DemoDate { get; set; }

        public string? AdminNotes { get; set; }
    }
}