using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/public/giving")]
    [Route("api/Giving/public")]
    [AllowAnonymous]
    public class PublicGivingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ResendEmailService _emailService;

        public PublicGivingController(
            ApplicationDbContext context,
            ResendEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // =====================================================
        // POST: api/public/giving
        // RECORD A REAL ONLINE GIVING TRANSFER
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> RecordPublicGiving(
            [FromBody] PublicGivingSubmissionDto request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Giving transfer details are required." });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new { message = "Giving amount must be greater than zero." });
            }

            try
            {
                // Normalize Giving Type
                var normalizedGivingType = NormalizeGivingType(request.GivingType);

                // Normalize Payment Method (GCash, Maya, Bank Transfer)
                var normalizedPaymentMethod = NormalizePaymentMethod(request.PaymentMethod);

                // Check for existing church member profile by phone number or name
                int? matchedMemberId = null;
                if (!request.IsAnonymous)
                {
                    var cleanPhone = request.DonorPhone?.Trim()?.Replace("-", "")?.Replace(" ", "");
                    if (!string.IsNullOrWhiteSpace(cleanPhone))
                    {
                        var member = await _context.Members
                            .AsNoTracking()
                            .Where(m => m.CustomerId == 1 &&
                                        m.ContactNumber != null &&
                                        (m.ContactNumber == cleanPhone || m.ContactNumber == request.DonorPhone!.Trim()))
                            .FirstOrDefaultAsync();

                        if (member != null)
                        {
                            matchedMemberId = member.MemberId;
                        }
                    }

                    if (!matchedMemberId.HasValue && !string.IsNullOrWhiteSpace(request.DonorName))
                    {
                        var nameParts = request.DonorName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (nameParts.Length >= 2)
                        {
                            var firstName = nameParts[0];
                            var lastName = nameParts[^1];
                            var memberByName = await _context.Members
                                .AsNoTracking()
                                .Where(m => m.CustomerId == 1 &&
                                            m.FirstName.ToLower() == firstName.ToLower() &&
                                            m.LastName.ToLower() == lastName.ToLower())
                                .FirstOrDefaultAsync();

                            if (memberByName != null)
                            {
                                matchedMemberId = memberByName.MemberId;
                            }
                        }
                    }
                }

                // Determine donor name
                var displayName = request.IsAnonymous
                    ? "Anonymous Giver"
                    : (string.IsNullOrWhiteSpace(request.DonorName) ? "Anonymous Giver" : request.DonorName.Trim());

                // Build audit notes
                var notes = $"Donor: {displayName} | Email: {request.DonorEmail?.Trim() ?? "None"} | Phone: {request.DonorPhone?.Trim() ?? "None"} | Freq: {request.Frequency?.Trim() ?? "One-Time"}";
                if (!string.IsNullOrWhiteSpace(request.PrayerRequest))
                {
                    notes += $" | Note: {request.PrayerRequest.Trim()}";
                }
                if (notes.Length > 500)
                {
                    notes = notes.Substring(0, 500);
                }

                var cleanRefNumber = string.IsNullOrWhiteSpace(request.ReferenceNumber)
                    ? $"ONLINE-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
                    : request.ReferenceNumber.Trim();

                // Create and persist real Giving record in MSSQL
                var giving = new Giving
                {
                    CustomerId = 1, // Default EPIC Church Customer ID
                    MemberId = matchedMemberId,
                    ChurchServiceId = null,
                    GivingType = normalizedGivingType,
                    Amount = request.Amount,
                    GivingDate = DateTime.Now,
                    PaymentMethod = normalizedPaymentMethod,
                    ReferenceNumber = cleanRefNumber,
                    Notes = notes,
                    RecordedBy = "ONLINE_GIVING_PORTAL",
                    RecordedDate = DateTime.Now
                };

                _context.Givings.Add(giving);
                await _context.SaveChangesAsync();

                var receiptCode = $"EPIC-GIVE-{giving.GivingId:D6}";

                // Fire dual email dispatch in background task
                _ = Task.Run(async () =>
                {
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(request.DonorEmail))
                        {
                            await _emailService.SendGivingReceiptDonorConfirmationAsync(
                                donorName: displayName,
                                donorEmail: request.DonorEmail.Trim(),
                                amount: giving.Amount,
                                givingType: giving.GivingType,
                                paymentMethod: giving.PaymentMethod,
                                referenceNumber: giving.ReferenceNumber,
                                receiptCode: receiptCode,
                                frequency: request.Frequency ?? "One-Time",
                                prayerRequest: request.PrayerRequest,
                                givingDate: giving.GivingDate);
                        }

                        await _emailService.SendGivingAlertAdminNotificationAsync(
                            donorName: displayName,
                            donorEmail: request.DonorEmail,
                            phone: request.DonorPhone,
                            amount: giving.Amount,
                            givingType: giving.GivingType,
                            paymentMethod: giving.PaymentMethod,
                            referenceNumber: giving.ReferenceNumber,
                            receiptCode: receiptCode,
                            frequency: request.Frequency ?? "One-Time",
                            prayerRequest: request.PrayerRequest,
                            givingDate: giving.GivingDate);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error sending giving confirmation emails: {ex.Message}");
                    }
                });

                return Ok(new
                {
                    success = true,
                    givingId = giving.GivingId,
                    receiptNumber = receiptCode,
                    amount = giving.Amount,
                    givingType = giving.GivingType,
                    paymentMethod = giving.PaymentMethod,
                    referenceNumber = giving.ReferenceNumber,
                    givingDate = giving.GivingDate,
                    donorName = displayName,
                    message = "Giving successfully recorded in EPIC Church Stewardship Ledger."
                });
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"DB Error saving public giving: {ex.Message} -> {ex.InnerException?.Message}");
                return StatusCode(500, new
                {
                    message = "Database error recording giving transfer. Please check back shortly.",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error recording public giving: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "An error occurred while recording giving transfer.",
                    error = ex.Message
                });
            }
        }

        // =====================================================
        // GET: api/public/giving/summary
        // GET LIVE SUMMARY STATS FOR STEWARDSHIP BADGE
        // =====================================================
        [HttpGet("summary")]
        public async Task<IActionResult> GetGivingSummary()
        {
            try
            {
                var totalCount = await _context.Givings.CountAsync();
                var lastGiving = await _context.Givings
                    .OrderByDescending(g => g.GivingDate)
                    .Select(g => (DateTime?)g.GivingDate)
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    totalGiftsRecorded = totalCount,
                    activeFundsCount = 6,
                    supportedChannels = new[] { "GCash (0995-632-6245)", "Maya (0995-632-6245)", "BDO", "BPI" },
                    churchName = "EPIC Church Ministries Foundation, Inc.",
                    lastRecordedDate = lastGiving
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    totalGiftsRecorded = 1,
                    activeFundsCount = 6,
                    supportedChannels = new[] { "GCash (0995-632-6245)", "Maya (0995-632-6245)", "BDO", "BPI" },
                    churchName = "EPIC Church Ministries Foundation, Inc.",
                    error = ex.Message
                });
            }
        }

        private static string NormalizeGivingType(string? rawType)
        {
            if (string.IsNullOrWhiteSpace(rawType)) return "OFFERING";

            var trimmed = rawType.Trim().ToUpperInvariant();
            return trimmed switch
            {
                "TITHES" or "TITHE" or "FIRSTFRUITS" => "TITHE",
                "OFFERING" or "GENERAL" or "LOVE OFFERING" => "OFFERING",
                "MISSIONS" or "MISSION" => "MISSION",
                "BUILDING" or "BUILDING_FUND" or "NEHEMIAH" => "SPECIAL OFFERING",
                "BENEVOLENCE" or "COMPASSION" => "SPECIAL OFFERING",
                "YOUTH" or "NEXTGEN" or "CAMP" => "SPECIAL OFFERING",
                _ => "OFFERING"
            };
        }

        private static string NormalizePaymentMethod(string? rawMethod)
        {
            if (string.IsNullOrWhiteSpace(rawMethod)) return "GCASH";

            var trimmed = rawMethod.Trim().ToUpperInvariant();
            if (trimmed.Contains("GCASH")) return "GCASH";
            if (trimmed.Contains("MAYA")) return "MAYA";
            if (trimmed.Contains("BDO") || trimmed.Contains("BPI") || trimmed.Contains("BANK")) return "BANK TRANSFER";
            if (trimmed.Contains("CHECK")) return "CHECK";
            return "GCASH";
        }
    }

    public class PublicGivingSubmissionDto
    {
        [Required]
        [Range(1, 10000000, ErrorMessage = "Giving amount must be greater than zero.")]
        public decimal Amount { get; set; }

        public string GivingType { get; set; } = "TITHE";

        public string PaymentMethod { get; set; } = "GCASH";

        public string? ReferenceNumber { get; set; }

        public string? DonorName { get; set; }

        public string? DonorEmail { get; set; }

        public string? DonorPhone { get; set; }

        public string? Frequency { get; set; } = "One-Time Gift";

        public string? PrayerRequest { get; set; }

        public bool IsAnonymous { get; set; } = false;
    }
}
