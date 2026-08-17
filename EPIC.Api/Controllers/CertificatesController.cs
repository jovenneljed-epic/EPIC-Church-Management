
using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CertificatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CertificatesController(ApplicationDbContext context)
        {
            _context = context;
        }


        // =========================================================
        // GET: api/Certificates/my
        // =========================================================

        [HttpGet("my")]
        public async Task<IActionResult> GetMyCertificates()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            var certificates = await _context.Certificates
                .AsNoTracking()
                .Include(c => c.Course)
                .Where(c => c.UserId == userId.Value)
                .OrderByDescending(c => c.IssuedDate)
                .Select(c => new
                {
                    c.CertificateId,
                    c.CertificateNumber,
                    c.CourseId,
                    courseTitle = c.CourseTitle,
                    c.RecipientName,
                    c.IssuedDate,
                    c.CertificateUrl
                })
                .ToListAsync();

            return Ok(certificates);
        }


        // =========================================================
        // GET: api/Certificates/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCertificate(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            var certificate = await _context.Certificates
                .AsNoTracking()
                .Include(c => c.Course)
                .FirstOrDefaultAsync(c =>
                    c.CertificateId == id &&
                    c.UserId == userId.Value);

            if (certificate == null)
            {
                return NotFound(new
                {
                    message = "Certificate not found."
                });
            }

            return Ok(new
            {
                certificate.CertificateId,
                certificate.CertificateNumber,
                certificate.CourseId,
                certificate.CourseTitle,
                certificate.RecipientName,
                certificate.IssuedDate,
                certificate.CertificateUrl
            });
        }


        // =========================================================
        // POST: api/Certificates/generate
        // =========================================================

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateCertificate(
            [FromBody] GenerateCertificateRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            // -----------------------------------------------------
            // Find enrollment belonging to authenticated user
            // -----------------------------------------------------

            var enrollment = await _context.CourseEnrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e =>
                    e.CourseEnrollmentId == request.CourseEnrollmentId &&
                    e.UserId == userId.Value);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Course enrollment not found."
                });
            }

            // -----------------------------------------------------
            // Verify course completion
            // -----------------------------------------------------

            if (!enrollment.IsCompleted ||
                enrollment.ProgressPercentage < 100)
            {
                return BadRequest(new
                {
                    message = "The course has not been completed yet.",
                    progressPercentage = enrollment.ProgressPercentage,
                    isCompleted = enrollment.IsCompleted
                });
            }

            // -----------------------------------------------------
            // Prevent duplicate certificates
            // -----------------------------------------------------

            var existingCertificate = await _context.Certificates
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.CourseId == enrollment.CourseId &&
                    c.UserId == userId.Value);

            if (existingCertificate != null)
            {
                return Ok(new
                {
                    message = "Certificate already exists.",
                    certificateId = existingCertificate.CertificateId,
                    certificateNumber =
                        existingCertificate.CertificateNumber,
                    courseId = existingCertificate.CourseId,
                    courseTitle =
                        existingCertificate.CourseTitle,
                    recipientName =
                        existingCertificate.RecipientName,
                    issuedDate =
                        existingCertificate.IssuedDate,
                    certificateUrl =
                        existingCertificate.CertificateUrl
                });
            }

            // -----------------------------------------------------
            // Get user
            // -----------------------------------------------------

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    u.UserId == userId.Value);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User account not found."
                });
            }

            // -----------------------------------------------------
            // Generate certificate number
            // -----------------------------------------------------

            var certificateNumber =
                await GenerateCertificateNumber();

            // -----------------------------------------------------
            // Create certificate
            // -----------------------------------------------------

            var certificate = new Certificate
            {
                CourseId = enrollment.CourseId,
                UserId = user.UserId,
                CertificateNumber = certificateNumber,
                RecipientName = user.FullName,
                CourseTitle = enrollment.Course?.Title
                    ?? "EPIC Learning Course",
                IssuedDate = DateTime.UtcNow
            };

            _context.Certificates.Add(certificate);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCertificate),
                new { id = certificate.CertificateId },
                new
                {
                    certificate.CertificateId,
                    certificate.CertificateNumber,
                    certificate.CourseId,
                    certificate.CourseTitle,
                    certificate.RecipientName,
                    certificate.IssuedDate,
                    certificate.CertificateUrl
                });
        }


        // =========================================================
        // PRIVATE: GENERATE CERTIFICATE NUMBER
        // =========================================================

        private async Task<string> GenerateCertificateNumber()
        {
            var year = DateTime.UtcNow.Year;

            var prefix = $"EPIC-{year}-";

            var existingNumbers = await _context.Certificates
                .AsNoTracking()
                .Where(c =>
                    c.CertificateNumber.StartsWith(prefix))
                .Select(c => c.CertificateNumber)
                .ToListAsync();

            var nextNumber = 1;

            foreach (var number in existingNumbers)
            {
                var numericPart =
                    number.Substring(prefix.Length);

                if (int.TryParse(
                    numericPart,
                    out var parsedNumber))
                {
                    if (parsedNumber >= nextNumber)
                    {
                        nextNumber = parsedNumber + 1;
                    }
                }
            }

            return $"{prefix}{nextNumber:D6}";
        }


        // =========================================================
        // HELPER
        // =========================================================

        private int? GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("UserId")?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }


    // =============================================================
    // REQUEST MODEL
    // =============================================================

    public class GenerateCertificateRequest
    {
        public int CourseEnrollmentId { get; set; }
    }
}

