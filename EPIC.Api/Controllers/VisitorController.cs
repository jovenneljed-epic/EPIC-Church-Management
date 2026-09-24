using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VisitorsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly VisitorPromotionService _promotionService;

        // =========================================================
        // ALLOWED ATTENDANCE STATUSES
        // =========================================================

        private static readonly string[] AllowedAttendanceStatuses =
        {
            "PRESENT",
            "LATE",
            "EARLY",
            "ABSENT",
            "EXCUSED"
        };

        // =========================================================
        // ALLOWED VISITOR STATUSES
        // =========================================================

        private static readonly string[] AllowedVisitorStatuses =
        {
            "ACTIVE",
            "INACTIVE"
        };

        public VisitorsController(
            ApplicationDbContext context,
            VisitorPromotionService promotionService)
        {
            _context = context;
            _promotionService = promotionService;
        }

        // =========================================================
        // GET ALL VISITORS
        // GET: /api/Visitors
        // Permission: Visitors / view
        // =========================================================

        [HttpGet]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> GetVisitors()
        {
            var visitors = await _context.Visitors
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedDate)
                .ToListAsync();

            // -----------------------------------------------------
            // Automatically synchronize lifecycle statuses
            // -----------------------------------------------------

            foreach (var visitor in visitors)
            {
                visitor.FollowUpStatus =
                    CalculateFollowUpStatus(visitor);
            }

            return Ok(
                visitors.Select(ProjectVisitor)
            );
        }

        // =========================================================
        // GET VISITOR BY ID
        // GET: /api/Visitors/{id}
        // Permission: Visitors / view
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> GetVisitor(int id)
        {
            var visitor = await _context.Visitors
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message = "VISITOR NOT FOUND."
                });
            }

            visitor.FollowUpStatus =
                CalculateFollowUpStatus(visitor);

            return Ok(
                ProjectVisitor(visitor)
            );
        }

        // =========================================================
        // SEARCH VISITORS
        // GET: /api/Visitors/search?name=Juan
        // Permission: Visitors / view
        // =========================================================

        [HttpGet("search")]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> SearchVisitors(
            [FromQuery] string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message =
                        "PLEASE ENTER A NAME TO SEARCH."
                });
            }

            var keyword =
                name.Trim().ToLower();

            var visitors = await _context.Visitors
                .AsNoTracking()
                .Where(v =>
                    (v.FirstName ?? "")
                        .ToLower()
                        .Contains(keyword) ||

                    (v.MiddleName ?? "")
                        .ToLower()
                        .Contains(keyword) ||

                    (v.LastName ?? "")
                        .ToLower()
                        .Contains(keyword) ||

                    (
                        (v.FirstName ?? "") + " " +
                        (v.MiddleName ?? "") + " " +
                        (v.LastName ?? "")
                    )
                    .ToLower()
                    .Contains(keyword) ||

                    (v.VisitorCode ?? "")
                        .ToLower()
                        .Contains(keyword)
                )
                .OrderBy(v => v.LastName)
                .ThenBy(v => v.FirstName)
                .ToListAsync();

            return Ok(
                visitors.Select(v => new
                {
                    visitorId =
                        v.VisitorId,

                    visitorCode =
                        v.VisitorCode,

                    fullName =
                        BuildFullName(
                            v.FirstName,
                            v.MiddleName,
                            v.LastName),

                    contactNumber =
                        v.ContactNumber,

                    ministry =
                        v.Ministry,

                    visitCount =
                        v.VisitCount,

                    followUpStatus =
                        CalculateFollowUpStatus(v),

                    status =
                        v.Status,

                    isConvertedToMember =
                        v.IsConvertedToMember,

                    convertedMemberId =
                        v.ConvertedMemberId
                })
            );
        }

        // =========================================================
        // GET VISITOR ATTENDANCE
        // GET: /api/Visitors/{id}/attendance
        // Permission: Visitors / view
        // =========================================================

        [HttpGet("{id:int}/attendance")]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> GetVisitorAttendance(
            int id)
        {
            var visitor = await _context.Visitors
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "VISITOR NOT FOUND."
                });
            }

            var attendance =
                await _context.VisitorAttendances
                    .AsNoTracking()
                    .Include(a => a.ChurchService)
                    .Where(a => a.VisitorId == id)
                    .OrderByDescending(
                        a => a.AttendanceDate)
                    .Select(a => new
                    {
                        visitorAttendanceId =
                            a.VisitorAttendanceId,

                        visitorId =
                            a.VisitorId,

                        churchServiceId =
                            a.ChurchServiceId,

                        serviceName =
                            a.ChurchService != null
                                ? a.ChurchService.ServiceName
                                : "",

                        attendanceDate =
                            a.AttendanceDate,

                        status =
                            NormalizeAttendanceStatus(
                                a.Status),

                        recordedBy =
                            a.RecordedBy,

                        recordedDate =
                            a.RecordedDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                visitor = new
                {
                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    fullName =
                        BuildFullName(
                            visitor.FirstName,
                            visitor.MiddleName,
                            visitor.LastName),

                    visitCount =
                        visitor.VisitCount,

                    followUpStatus =
                        CalculateFollowUpStatus(visitor),

                    isConvertedToMember =
                        visitor.IsConvertedToMember,

                    convertedMemberId =
                        visitor.ConvertedMemberId
                },

                attendance
            });
        }

        // =========================================================
        // CREATE VISITOR
        // POST: /api/Visitors
        // Permission: Visitors / create
        // =========================================================

        [HttpPost]
        [Permission("Visitors", "create")]
        public async Task<IActionResult> CreateVisitor(
            [FromBody] VisitorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "VISITOR INFORMATION IS REQUIRED."
                });
            }

            var validation =
                ValidateVisitorRequest(request);

            if (validation != null)
            {
                return validation;
            }

            // -----------------------------------------------------
            // DUPLICATE PREVENTION LOGIC
            // Ensure no duplicate visitor is registered with the same name.
            // -----------------------------------------------------
            var reqFirst = request.FirstName.Trim();
            var reqLast = request.LastName.Trim();
            var reqMiddle = request.MiddleName?.Trim() ?? "";

            var existingCandidates = await _context.Visitors
                .AsNoTracking()
                .Where(v =>
                    v.FirstName.ToLower() == reqFirst.ToLower() &&
                    v.LastName.ToLower() == reqLast.ToLower())
                .ToListAsync();

            var duplicate = existingCandidates.FirstOrDefault(c =>
            {
                var cMiddle = c.MiddleName?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(reqMiddle) || string.IsNullOrWhiteSpace(cMiddle))
                {
                    return true;
                }
                if (cMiddle.Equals(reqMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                if (reqMiddle.Length == 1 && cMiddle.StartsWith(reqMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                if (cMiddle.Length == 1 && reqMiddle.StartsWith(cMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                return false;
            });

            if (duplicate != null)
            {
                return Conflict(new
                {
                    message = $"A visitor with the name \"{duplicate.FirstName} {duplicate.LastName}\" already exists ({duplicate.VisitorCode}). Duplicate entries are not allowed."
                });
            }

            var now =
                DateTime.Now;

            var visitor =
                new Visitor
                {
                    VisitorCode =
                        await GenerateVisitorCode(),

                    FirstName =
                        request.FirstName.Trim(),

                    MiddleName =
                        request.MiddleName?
                            .Trim() ?? "",

                    LastName =
                        request.LastName.Trim(),

                    Gender =
                        request.Gender?
                            .Trim()
                            .ToUpper() ?? "",

                    BirthDate =
                        request.BirthDate,

                    ContactNumber =
                        request.ContactNumber?
                            .Trim() ?? "",

                    Address =
                        request.Address?
                            .Trim() ?? "",

                    InvitedBy =
                        request.InvitedBy?
                            .Trim() ?? "",

                    Ministry =
                        request.Ministry?
                            .Trim()
                            .ToUpper() ?? "",

                    FirstVisitDate =
                        request.FirstVisitDate
                        ?? DateTime.Today,

                    VisitCount =
                        0,

                    // -------------------------------------------------
                    // AUTOMATIC LIFECYCLE
                    // New visitor starts as NEW.
                    // -------------------------------------------------

                    FollowUpStatus =
                        "NEW",

                    Status =
                        "ACTIVE",

                    Notes =
                        request.Notes?
                            .Trim() ?? "",

                    IsConvertedToMember =
                        false,

                    ConvertedMemberId =
                        null,

                    ConversionDate =
                        null,

                    CreatedDate =
                        now,

                    UpdatedDate =
                        null
                };

            _context.Visitors.Add(visitor);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetVisitor),
                new
                {
                    id =
                        visitor.VisitorId
                },
                new
                {
                    message =
                        "VISITOR CREATED SUCCESSFULLY.",

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    followUpStatus =
                        visitor.FollowUpStatus
                });
        }

        // =========================================================
        // UPDATE VISITOR
        // PUT: /api/Visitors/{id}
        // Permission: Visitors / edit
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Visitors", "edit")]
        public async Task<IActionResult> UpdateVisitor(
            int id,
            [FromBody] VisitorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "VISITOR INFORMATION IS REQUIRED."
                });
            }

            var validation =
                ValidateVisitorRequest(request);

            if (validation != null)
            {
                return validation;
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "VISITOR NOT FOUND."
                });
            }

            if (visitor.IsConvertedToMember)
            {
                return BadRequest(new
                {
                    message =
                        "THIS VISITOR HAS ALREADY BEEN CONVERTED TO A MEMBER."
                });
            }

            // -----------------------------------------------------
            // DUPLICATE PREVENTION LOGIC
            // Ensure no other visitor already has this name.
            // -----------------------------------------------------
            var reqFirst = request.FirstName.Trim();
            var reqLast = request.LastName.Trim();
            var reqMiddle = request.MiddleName?.Trim() ?? "";

            var existingCandidates = await _context.Visitors
                .AsNoTracking()
                .Where(v =>
                    v.VisitorId != id &&
                    v.FirstName.ToLower() == reqFirst.ToLower() &&
                    v.LastName.ToLower() == reqLast.ToLower())
                .ToListAsync();

            var duplicate = existingCandidates.FirstOrDefault(c =>
            {
                var cMiddle = c.MiddleName?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(reqMiddle) || string.IsNullOrWhiteSpace(cMiddle))
                {
                    return true;
                }
                if (cMiddle.Equals(reqMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                if (reqMiddle.Length == 1 && cMiddle.StartsWith(reqMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                if (cMiddle.Length == 1 && reqMiddle.StartsWith(cMiddle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                return false;
            });

            if (duplicate != null)
            {
                return Conflict(new
                {
                    message = $"Another visitor with the name \"{duplicate.FirstName} {duplicate.LastName}\" already exists ({duplicate.VisitorCode}). Duplicate entries are not allowed."
                });
            }

            visitor.FirstName =
                request.FirstName.Trim();

            visitor.MiddleName =
                request.MiddleName?.Trim() ?? "";

            visitor.LastName =
                request.LastName.Trim();

            visitor.Gender =
                request.Gender?
                    .Trim()
                    .ToUpper() ?? "";

            visitor.BirthDate =
                request.BirthDate;

            visitor.ContactNumber =
                request.ContactNumber?
                    .Trim() ?? "";

            visitor.Address =
                request.Address?
                    .Trim() ?? "";

            visitor.InvitedBy =
                request.InvitedBy?
                    .Trim() ?? "";

            visitor.Ministry =
                request.Ministry?
                    .Trim()
                    .ToUpper() ?? "";

            if (request.FirstVisitDate.HasValue)
            {
                visitor.FirstVisitDate =
                    request.FirstVisitDate.Value;
            }

            visitor.Notes =
                request.Notes?
                    .Trim() ?? "";

            // -----------------------------------------------------
            // NEVER accept FollowUpStatus from the client.
            // Always calculate it from the visitor history.
            // -----------------------------------------------------

            visitor.FollowUpStatus =
                CalculateFollowUpStatus(visitor);

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "VISITOR UPDATED SUCCESSFULLY.",

                visitorId =
                    visitor.VisitorId,

                followUpStatus =
                    visitor.FollowUpStatus
            });
        }

        // =========================================================
        // UPDATE VISITOR ACTIVE/INACTIVE STATUS
        // PATCH: /api/Visitors/{id}/status
        // Permission: Visitors / edit
        // =========================================================

        [HttpPatch("{id:int}/status")]
        [Permission("Visitors", "edit")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] StatusRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new
                {
                    message =
                        "STATUS IS REQUIRED."
                });
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "VISITOR NOT FOUND."
                });
            }

            var status =
                request.Status
                    .Trim()
                    .ToUpperInvariant();

            if (!AllowedVisitorStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "INVALID VISITOR STATUS.",

                    allowedStatuses =
                        AllowedVisitorStatuses
                });
            }

            visitor.Status =
                status;

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "VISITOR STATUS UPDATED SUCCESSFULLY.",

                visitorId =
                    visitor.VisitorId,

                status =
                    visitor.Status
            });
        }

        // =========================================================
        // RECORD VISITOR ATTENDANCE
        // POST: /api/Visitors/{id}/attendance
        // Permission: Visitors / create
        //
        // THIS AUTOMATICALLY ADVANCES THE FOLLOW-UP LIFECYCLE.
        // =========================================================

        [HttpPost("{id:int}/attendance")]
        [Permission("Visitors", "create")]
        public async Task<IActionResult> RecordAttendance(
            int id,
            [FromBody] VisitorAttendanceRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "ATTENDANCE INFORMATION IS REQUIRED."
                });
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "VISITOR NOT FOUND."
                });
            }

            if (!string.Equals(
                    visitor.Status?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "ATTENDANCE CANNOT BE RECORDED FOR AN INACTIVE VISITOR."
                });
            }

            // -----------------------------------------------------
            // Already converted?
            // -----------------------------------------------------

            if (visitor.IsConvertedToMember)
            {
                return BadRequest(new
                {
                    message =
                        "THIS VISITOR HAS ALREADY BEEN CONVERTED TO A MEMBER."
                });
            }

            var service =
                await _context.ChurchServices
                    .FirstOrDefaultAsync(
                        s =>
                            s.ChurchServiceId ==
                            request.ChurchServiceId);

            if (service == null)
            {
                return NotFound(new
                {
                    message =
                        "CHURCH SERVICE NOT FOUND."
                });
            }

            var serviceStatus =
                NormalizeServiceStatus(
                    service.Status);

            if (serviceStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "VISITOR ATTENDANCE CAN ONLY BE RECORDED FOR COMPLETED CHURCH SERVICES."
                });
            }

            // -----------------------------------------------------
            // Prevent duplicate attendance
            // -----------------------------------------------------

            var existing =
                await _context.VisitorAttendances
                    .FirstOrDefaultAsync(
                        a =>
                            a.VisitorId == id &&
                            a.ChurchServiceId ==
                            request.ChurchServiceId);

            if (existing != null)
            {
                return Conflict(new
                {
                    message =
                        "ATTENDANCE HAS ALREADY BEEN RECORDED FOR THIS VISITOR FOR THIS CHURCH SERVICE."
                });
            }

            var status =
                string.IsNullOrWhiteSpace(
                    request.Status)
                    ? "PRESENT"
                    : request.Status
                        .Trim()
                        .ToUpperInvariant();

            if (!AllowedAttendanceStatuses
                .Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        $"INVALID ATTENDANCE STATUS: {status}",

                    allowedStatuses =
                        AllowedAttendanceStatuses
                });
            }

            var recordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";

            var attendance =
                new VisitorAttendance
                {
                    VisitorId =
                        id,

                    ChurchServiceId =
                        request.ChurchServiceId,

                    AttendanceDate =
                        service.ServiceDate,

                    Status =
                        status,

                    RecordedBy =
                        recordedBy,

                    RecordedDate =
                        DateTime.Now
                };

            _context.VisitorAttendances.Add(
                attendance);

            await _context.SaveChangesAsync();

            // =====================================================
            // RECALCULATE VISIT COUNT
            // =====================================================

            visitor.VisitCount =
                await _context.VisitorAttendances
                    .CountAsync(
                        a => a.VisitorId == id);

            // -----------------------------------------------------
            // First visit date
            // -----------------------------------------------------

            if (visitor.VisitCount == 1)
            {
                visitor.FirstVisitDate =
                    service.ServiceDate;
            }

            // =====================================================
            // AUTOMATIC FOLLOW-UP LIFECYCLE
            // =====================================================

            visitor.FollowUpStatus =
                CalculateFollowUpStatus(visitor);

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            // =====================================================
            // AUTOMATIC VISITOR PROMOTION BASED ON ATTENDANCE RATING
            // =====================================================

            var promotionResult = await _promotionService
                .AutoConvertVisitorIfEligibleAsync(
                    visitor.VisitorId,
                    VisitorPromotionService.DefaultAttendanceThreshold,
                    recordedBy);

            return Ok(new
            {
                message = promotionResult.WasAutoConverted
                    ? promotionResult.Message
                    : "VISITOR ATTENDANCE RECORDED SUCCESSFULLY.",

                visitorId =
                    visitor.VisitorId,

                visitorCode =
                    visitor.VisitorCode,

                visitCount =
                    visitor.VisitCount,

                attendanceId =
                    attendance.VisitorAttendanceId,

                status =
                    attendance.Status,

                followUpStatus =
                    visitor.FollowUpStatus,

                autoConverted =
                    promotionResult.WasAutoConverted,

                convertedMemberId =
                    promotionResult.MemberId,

                convertedMemberCode =
                    promotionResult.MemberCode,

                conversionDate =
                    promotionResult.ConversionDate,

                attendanceRating =
                    VisitorPromotionService.CalculateAttendanceRating(visitor.VisitCount, VisitorPromotionService.DefaultAttendanceThreshold)
            });
        }

        // =========================================================
        // CONVERT VISITOR TO MEMBER
        // POST: /api/Visitors/{id}/convert-to-member
        // Permission: Visitors / edit
        //
        // CONVERSION AUTOMATICALLY SETS FOLLOW-UP STATUS TO
        // CONVERTED.
        // =========================================================

        [HttpPost("{id:int}/convert-to-member")]
        [Permission("Visitors", "edit")]
        public async Task<IActionResult>
            ConvertToMember(int id)
        {
            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                var visitor =
                    await _context.Visitors
                        .FirstOrDefaultAsync(
                            v => v.VisitorId == id);

                if (visitor == null)
                {
                    return NotFound(new
                    {
                        message =
                            "VISITOR NOT FOUND."
                    });
                }

                if (visitor.IsConvertedToMember &&
                    visitor.ConvertedMemberId.HasValue)
                {
                    return Conflict(new
                    {
                        message =
                            "VISITOR HAS ALREADY BEEN CONVERTED TO A MEMBER.",

                        visitorId =
                            visitor.VisitorId,

                        memberId =
                            visitor.ConvertedMemberId
                    });
                }

                var now =
                    DateTime.Now;

                var memberCode =
                    await GenerateMemberCode();

                var member =
                    new Member
                    {
                        MemberCode =
                            memberCode,

                        FirstName =
                            visitor.FirstName.Trim(),

                        MiddleName =
                            visitor.MiddleName?
                                .Trim() ?? "",

                        LastName =
                            visitor.LastName.Trim(),

                        Gender =
                            visitor.Gender?
                                .Trim()
                                .ToUpper() ?? "",

                        BirthDate =
                            visitor.BirthDate,

                        ContactNumber =
                            visitor.ContactNumber?
                                .Trim() ?? "",

                        Address =
                            visitor.Address?
                                .Trim() ?? "",

                        CivilStatus =
                            "",

                        Ministry =
                            visitor.Ministry?
                                .Trim()
                                .ToUpper() ?? "",

                        DateJoined =
                            now,

                        Status =
                            "ACTIVE",

                        PhotoPath =
                            "",

                        CreatedDate =
                            now,

                        UpdatedDate =
                            null
                    };

                _context.Members.Add(member);

                await _context.SaveChangesAsync();

                // =================================================
                // MARK VISITOR AS CONVERTED
                // =================================================

                visitor.IsConvertedToMember =
                    true;

                visitor.ConvertedMemberId =
                    member.MemberId;

                visitor.ConversionDate =
                    now;

                // -------------------------------------------------
                // CONVERTED IS THE ONLY MANUAL-LIKE LIFECYCLE
                // EVENT. IT IS AUTOMATICALLY ASSIGNED HERE.
                // -------------------------------------------------

                visitor.FollowUpStatus =
                    "CONVERTED";

                visitor.UpdatedDate =
                    now;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "VISITOR CONVERTED TO MEMBER SUCCESSFULLY.",

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    memberId =
                        member.MemberId,

                    memberCode =
                        member.MemberCode,

                    conversionDate =
                        visitor.ConversionDate,

                    followUpStatus =
                        visitor.FollowUpStatus
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "AN ERROR OCCURRED WHILE CONVERTING THE VISITOR TO A MEMBER."
                    });
            }
        }

        // =========================================================
        // SCAN & AUTO-CONVERT ALL ELIGIBLE VISITORS
        // POST: /api/Visitors/auto-convert-scan
        // Permission: Visitors / edit
        // =========================================================

        [HttpPost("auto-convert-scan")]
        [Permission("Visitors", "edit")]
        public async Task<IActionResult> AutoConvertEligibleScan(
            [FromQuery] int threshold = VisitorPromotionService.DefaultAttendanceThreshold)
        {
            var results = await _promotionService
                .AutoConvertAllEligibleVisitorsAsync(
                    customerId: null,
                    threshold: threshold,
                    recordedBy: User.Identity?.Name ?? "BATCH_AUTOMATION");

            return Ok(new
            {
                convertedCount = results.Count,
                message = results.Count > 0
                    ? $"Successfully auto-converted {results.Count} eligible visitor(s) to official members!"
                    : "No eligible unconverted visitors found.",
                promotions = results
            });
        }

        // =========================================================
        // GET CONVERSION & RATING METRICS
        // GET: /api/Visitors/conversion-metrics
        // Permission: Visitors / view
        // =========================================================

        [HttpGet("conversion-metrics")]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> GetConversionMetrics(
            [FromQuery] int threshold = VisitorPromotionService.DefaultAttendanceThreshold)
        {
            var metrics = await _promotionService
                .GetConversionMetricsAsync(customerId: null, threshold: threshold);

            return Ok(metrics);
        }

        // =========================================================
        // REMOVE / MERGE DUPLICATE VISITORS
        // POST: /api/Visitors/deduplicate
        // Permission: Visitors / edit
        // =========================================================

        [HttpPost("deduplicate")]
        [Permission("Visitors", "edit")]
        public async Task<IActionResult> DeduplicateVisitors()
        {
            var allVisitors = await _context.Visitors
                .Include(v => v.VisitorAttendances)
                .OrderBy(v => v.CreatedDate)
                .ToListAsync();

            var grouped = allVisitors
                .GroupBy(v => new
                {
                    First = v.FirstName.Trim().ToUpperInvariant(),
                    Last = v.LastName.Trim().ToUpperInvariant()
                })
                .Where(g => g.Count() > 1)
                .ToList();

            if (!grouped.Any())
            {
                return Ok(new
                {
                    message = "Zero duplicate visitor entries found. Your records are completely clean and unique!",
                    duplicatesRemoved = 0,
                    mergedGroups = 0
                });
            }

            int duplicatesRemoved = 0;
            int groupsMerged = 0;
            var details = new List<string>();

            foreach (var group in grouped)
            {
                // Select keeper/primary: prioritize converted first, then attendance count, then visit count, then oldest
                var primary = group
                    .OrderByDescending(v => v.IsConvertedToMember)
                    .ThenByDescending(v => v.VisitorAttendances.Count)
                    .ThenByDescending(v => v.VisitCount)
                    .ThenBy(v => v.CreatedDate)
                    .First();

                var duplicates = group
                    .Where(v => v.VisitorId != primary.VisitorId)
                    .ToList();

                foreach (var dup in duplicates)
                {
                    foreach (var att in dup.VisitorAttendances.ToList())
                    {
                        bool alreadyHas = primary.VisitorAttendances
                            .Any(a => a.ChurchServiceId == att.ChurchServiceId);

                        if (!alreadyHas)
                        {
                            att.VisitorId = primary.VisitorId;
                            primary.VisitorAttendances.Add(att);
                        }
                        else
                        {
                            _context.VisitorAttendances.Remove(att);
                        }
                    }

                    if (string.IsNullOrWhiteSpace(primary.MiddleName) && !string.IsNullOrWhiteSpace(dup.MiddleName))
                    {
                        primary.MiddleName = dup.MiddleName;
                    }
                    if (string.IsNullOrWhiteSpace(primary.ContactNumber) && !string.IsNullOrWhiteSpace(dup.ContactNumber))
                    {
                        primary.ContactNumber = dup.ContactNumber;
                    }
                    if (string.IsNullOrWhiteSpace(primary.Address) && !string.IsNullOrWhiteSpace(dup.Address))
                    {
                        primary.Address = dup.Address;
                    }
                    if (string.IsNullOrWhiteSpace(primary.InvitedBy) && !string.IsNullOrWhiteSpace(dup.InvitedBy))
                    {
                        primary.InvitedBy = dup.InvitedBy;
                    }

                    _context.Visitors.Remove(dup);
                    duplicatesRemoved++;
                }

                primary.VisitCount = primary.VisitorAttendances.Count;
                primary.FollowUpStatus = CalculateFollowUpStatus(primary);
                primary.UpdatedDate = DateTime.Now;

                groupsMerged++;
                details.Add($"{primary.FirstName} {primary.LastName} ({primary.VisitorCode})");
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully cleaned records! Removed {duplicatesRemoved} duplicate visitor record(s) across {groupsMerged} group(s).",
                duplicatesRemoved,
                mergedGroups = groupsMerged,
                mergedVisitors = details
            });
        }

        // =========================================================
        // DELETE / DEACTIVATE VISITOR
        // DELETE: /api/Visitors/{id}
        // Permission: Visitors / delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Visitors", "delete")]
        public async Task<IActionResult>
            DeleteVisitor(int id)
        {
            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "VISITOR NOT FOUND."
                });
            }

            // -----------------------------------------------------
            // Converted visitors are never physically deleted.
            // -----------------------------------------------------

            if (visitor.IsConvertedToMember)
            {
                visitor.Status =
                    "INACTIVE";

                visitor.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "CONVERTED VISITOR WAS DEACTIVATED INSTEAD OF DELETED.",

                    visitorId =
                        visitor.VisitorId,

                    status =
                        visitor.Status,

                    followUpStatus =
                        visitor.FollowUpStatus
                });
            }

            _context.Visitors.Remove(visitor);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "VISITOR DELETED SUCCESSFULLY.",

                visitorId =
                    id
            });
        }

        // =========================================================
        // VISITOR DASHBOARD
        // GET: /api/Visitors/dashboard
        // Permission: Visitors / view
        // =========================================================

        [HttpGet("dashboard")]
        [Permission("Visitors", "view")]
        public async Task<IActionResult> GetDashboard()
        {
            var visitors =
                await _context.Visitors
                    .AsNoTracking()
                    .ToListAsync();

            // =====================================================
            // AUTOMATIC LIFECYCLE COUNTS
            // =====================================================

            var total =
                visitors.Count;

            var active =
                visitors.Count(v =>
                    string.Equals(
                        v.Status,
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase));

            var inactive =
                visitors.Count(v =>
                    string.Equals(
                        v.Status,
                        "INACTIVE",
                        StringComparison.OrdinalIgnoreCase));

            var newVisitors =
                visitors.Count(v =>
                    CalculateFollowUpStatus(v) == "NEW");

            var contacted =
                visitors.Count(v =>
                    CalculateFollowUpStatus(v) == "CONTACTED");

            var followUps =
                visitors.Count(v =>
                    CalculateFollowUpStatus(v) == "FOLLOW-UP");

            var connected =
                visitors.Count(v =>
                    CalculateFollowUpStatus(v) == "CONNECTED");

            var converted =
                visitors.Count(v =>
                    CalculateFollowUpStatus(v) == "CONVERTED");

            var firstTimeVisitors =
                visitors.Count(v =>
                    v.VisitCount <= 1);

            var returningVisitors =
                visitors.Count(v =>
                    v.VisitCount > 1);

            return Ok(new
            {
                totalVisitors =
                    total,

                activeVisitors =
                    active,

                inactiveVisitors =
                    inactive,

                newVisitors =
                    newVisitors,

                contactedVisitors =
                    contacted,

                followUpVisitors =
                    followUps,

                connectedVisitors =
                    connected,

                convertedMembers =
                    converted,

                firstTimeVisitors =
                    firstTimeVisitors,

                returningVisitors =
                    returningVisitors
            });
        }

        // =========================================================
        // AUTOMATIC FOLLOW-UP LIFECYCLE
        // =========================================================
        //
        // NEW
        //   ↓
        // First recorded visit
        //   ↓
        // CONTACTED
        //   ↓
        // Second recorded visit
        //   ↓
        // FOLLOW-UP
        //   ↓
        // Third or more visits
        //   ↓
        // CONNECTED
        //   ↓
        // Converted to member
        //   ↓
        // CONVERTED
        //
        // IMPORTANT:
        // FollowUpStatus is NEVER determined by user input.
        // It is calculated from the visitor's actual history.
        // =========================================================

        private static string CalculateFollowUpStatus(
            Visitor visitor)
        {
            // -----------------------------------------------------
            // Highest priority: converted member
            // -----------------------------------------------------

            if (visitor.IsConvertedToMember ||
                visitor.ConvertedMemberId.HasValue)
            {
                return "CONVERTED";
            }

            // -----------------------------------------------------
            // No visit yet
            // -----------------------------------------------------

            if (visitor.VisitCount <= 0)
            {
                return "NEW";
            }

            // -----------------------------------------------------
            // First visit
            // -----------------------------------------------------

            if (visitor.VisitCount == 1)
            {
                return "CONTACTED";
            }

            // -----------------------------------------------------
            // Second visit
            // -----------------------------------------------------

            if (visitor.VisitCount == 2)
            {
                return "FOLLOW-UP";
            }

            // -----------------------------------------------------
            // Third visit onward
            // -----------------------------------------------------

            return "CONNECTED";
        }

        // =========================================================
        // VALIDATE VISITOR
        // =========================================================

        private static IActionResult? ValidateVisitorRequest(
            VisitorRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                request.FirstName))
            {
                return new BadRequestObjectResult(new
                {
                    message =
                        "FIRST NAME IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(
                request.LastName))
            {
                return new BadRequestObjectResult(new
                {
                    message =
                        "LAST NAME IS REQUIRED."
                });
            }

            return null;
        }

        // =========================================================
        // NORMALIZE SERVICE STATUS
        // =========================================================

        private static string NormalizeServiceStatus(
            string? status)
        {
            return string.IsNullOrWhiteSpace(status)
                ? "SCHEDULED"
                : status
                    .Trim()
                    .ToUpperInvariant();
        }

        // =========================================================
        // NORMALIZE ATTENDANCE STATUS
        // =========================================================

        private static string NormalizeAttendanceStatus(
            string? status)
        {
            var normalized =
                string.IsNullOrWhiteSpace(status)
                    ? "PRESENT"
                    : status
                        .Trim()
                        .ToUpperInvariant();

            return AllowedAttendanceStatuses
                .Contains(normalized)
                    ? normalized
                    : "PRESENT";
        }

        // =========================================================
        // BUILD FULL NAME
        // =========================================================

        private static string BuildFullName(
            string? firstName,
            string? middleName,
            string? lastName)
        {
            return (
                (lastName ?? "") + ", " +
                (firstName ?? "") +
                (
                    string.IsNullOrWhiteSpace(middleName)
                        ? ""
                        : " " + middleName
                )
            ).Trim();
        }

        // =========================================================
        // PROJECT VISITOR
        // =========================================================

        private static object ProjectVisitor(
            Visitor v)
        {
            return new
            {
                visitorId =
                    v.VisitorId,

                visitorCode =
                    v.VisitorCode,

                firstName =
                    v.FirstName,

                middleName =
                    v.MiddleName,

                lastName =
                    v.LastName,

                fullName =
                    BuildFullName(
                        v.FirstName,
                        v.MiddleName,
                        v.LastName),

                gender =
                    v.Gender,

                birthDate =
                    v.BirthDate,

                contactNumber =
                    v.ContactNumber,

                address =
                    v.Address,

                invitedBy =
                    v.InvitedBy,

                ministry =
                    v.Ministry,

                firstVisitDate =
                    v.FirstVisitDate,

                visitCount =
                    v.VisitCount,

                // -------------------------------------------------
                // IMPORTANT:
                // Return calculated status instead of trusting
                // whatever value happens to be stored in DB.
                // -------------------------------------------------

                followUpStatus =
                    CalculateFollowUpStatus(v),

                status =
                    v.Status,

                notes =
                    v.Notes,

                isConvertedToMember =
                    v.IsConvertedToMember,

                convertedMemberId =
                    v.ConvertedMemberId,

                conversionDate =
                    v.ConversionDate,

                createdDate =
                    v.CreatedDate,

                updatedDate =
                    v.UpdatedDate,

                attendanceRating =
                    VisitorPromotionService.CalculateAttendanceRating(v.VisitCount, VisitorPromotionService.DefaultAttendanceThreshold)
            };
        }

        // =========================================================
        // GENERATE VISITOR CODE
        // =========================================================

        private async Task<string>
            GenerateVisitorCode()
        {
            var year =
                DateTime.Now.Year;

            var prefix =
                $"VIS-{year}-";

            var codes =
                await _context.Visitors
                    .AsNoTracking()
                    .Where(v =>
                        v.VisitorCode != null &&
                        v.VisitorCode.StartsWith(prefix))
                    .Select(v =>
                        v.VisitorCode)
                    .ToListAsync();

            var maxNumber =
                0;

            foreach (var code in codes)
            {
                if (string.IsNullOrWhiteSpace(code))
                    continue;

                var numberPart =
                    code.Substring(prefix.Length);

                if (int.TryParse(
                    numberPart,
                    out var number))
                {
                    if (number > maxNumber)
                    {
                        maxNumber =
                            number;
                    }
                }
            }

            return
                $"{prefix}{maxNumber + 1:D4}";
        }

        // =========================================================
        // GENERATE MEMBER CODE
        // =========================================================

        private async Task<string>
            GenerateMemberCode()
        {
            var lastMemberId =
                await _context.Members
                    .AsNoTracking()
                    .Select(m =>
                        (int?)m.MemberId)
                    .MaxAsync() ?? 0;

            return
                $"MEM-{lastMemberId + 1:0000}";
        }

        // =========================================================
        // REQUEST MODELS
        // =========================================================

        public class VisitorRequest
        {
            public string FirstName { get; set; } = "";

            public string MiddleName { get; set; } = "";

            public string LastName { get; set; } = "";

            public string Gender { get; set; } = "";

            public DateTime? BirthDate { get; set; }

            public string ContactNumber { get; set; } = "";

            public string Address { get; set; } = "";

            public string InvitedBy { get; set; } = "";

            public string Ministry { get; set; } = "";

            public DateTime? FirstVisitDate { get; set; }

            public string Notes { get; set; } = "";
        }

        // =========================================================
        // VISITOR ATTENDANCE REQUEST
        //
        // Follow-up status is intentionally NOT included.
        // =========================================================

        public class VisitorAttendanceRequest
        {
            public int ChurchServiceId { get; set; }

            public string Status { get; set; } = "PRESENT";
        }
    }
}


