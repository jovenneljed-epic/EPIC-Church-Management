using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services
{
    public class AttendanceRatingInfo
    {
        public int VisitCount { get; set; }
        public int RequiredThreshold { get; set; } = 4;
        public int RatingPercentage { get; set; }
        public int Stars { get; set; }
        public bool IsEligible { get; set; }
        public string TierLabel { get; set; } = string.Empty;
    }

    public class VisitorPromotionResult
    {
        public bool WasAutoConverted { get; set; }
        public bool AlreadyConverted { get; set; }
        public int VisitorId { get; set; }
        public string VisitorCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int VisitCount { get; set; }
        public int? MemberId { get; set; }
        public string? MemberCode { get; set; }
        public DateTime? ConversionDate { get; set; }
        public string Message { get; set; } = string.Empty;
        public int CopiedAttendanceCount { get; set; }
    }

    public class VisitorPromotionService
    {
        private readonly ApplicationDbContext _context;
        public const int DefaultAttendanceThreshold = 4;

        public VisitorPromotionService(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CALCULATE ATTENDANCE RATING
        // =========================================================
        public static AttendanceRatingInfo CalculateAttendanceRating(int visitCount, int threshold = DefaultAttendanceThreshold)
        {
            if (threshold <= 0) threshold = DefaultAttendanceThreshold;
            var clampedVisits = Math.Max(0, visitCount);
            var percentage = Math.Min(100, (int)Math.Round((double)clampedVisits / threshold * 100));
            var stars = Math.Min(threshold, clampedVisits);
            var isEligible = clampedVisits >= threshold;

            string tierLabel;
            if (clampedVisits == 0) tierLabel = "New Visitor";
            else if (clampedVisits == 1) tierLabel = "First-Time (25%)";
            else if (clampedVisits == 2) tierLabel = "Returning (50%)";
            else if (clampedVisits == 3) tierLabel = "Connected Candidate (75%)";
            else tierLabel = "Membership Qualified (100%)";

            return new AttendanceRatingInfo
            {
                VisitCount = clampedVisits,
                RequiredThreshold = threshold,
                RatingPercentage = percentage,
                Stars = stars,
                IsEligible = isEligible,
                TierLabel = tierLabel
            };
        }

        // =========================================================
        // AUTO-CONVERT SINGLE VISITOR IF ELIGIBLE
        // =========================================================
        public async Task<VisitorPromotionResult> AutoConvertVisitorIfEligibleAsync(
            int visitorId,
            int threshold = DefaultAttendanceThreshold,
            string recordedBy = "AUTOMATION")
        {
            var visitor = await _context.Visitors
                .Include(v => v.VisitorAttendances)
                .FirstOrDefaultAsync(v => v.VisitorId == visitorId);

            if (visitor == null)
            {
                return new VisitorPromotionResult
                {
                    WasAutoConverted = false,
                    Message = "Visitor not found."
                };
            }

            var fullName = $"{visitor.FirstName} {(string.IsNullOrWhiteSpace(visitor.MiddleName) ? "" : visitor.MiddleName + " ")}{visitor.LastName}".Trim();

            // Already converted?
            if (visitor.IsConvertedToMember && visitor.ConvertedMemberId.HasValue)
            {
                var existingMember = await _context.Members
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.MemberId == visitor.ConvertedMemberId.Value);

                return new VisitorPromotionResult
                {
                    WasAutoConverted = false,
                    AlreadyConverted = true,
                    VisitorId = visitor.VisitorId,
                    VisitorCode = visitor.VisitorCode,
                    FullName = fullName,
                    VisitCount = visitor.VisitCount,
                    MemberId = visitor.ConvertedMemberId,
                    MemberCode = existingMember?.MemberCode,
                    ConversionDate = visitor.ConversionDate,
                    Message = $"Visitor {fullName} is already an official member ({existingMember?.MemberCode ?? "MEM"})."
                };
            }

            // Recalculate distinct unique church services attended
            var distinctServicesAttended = visitor.VisitorAttendances
                .Select(a => a.ChurchServiceId)
                .Distinct()
                .Count();

            // Sync VisitCount
            if (distinctServicesAttended > visitor.VisitCount)
            {
                visitor.VisitCount = distinctServicesAttended;
            }

            // Check if reaches threshold
            if (visitor.VisitCount < threshold)
            {
                // Not yet reached threshold
                visitor.FollowUpStatus = visitor.VisitCount switch
                {
                    0 => "NEW",
                    1 => "CONTACTED",
                    2 => "FOLLOW-UP",
                    _ => "CONNECTED"
                };
                visitor.UpdatedDate = DateTime.Now;
                await _context.SaveChangesAsync();

                return new VisitorPromotionResult
                {
                    WasAutoConverted = false,
                    VisitorId = visitor.VisitorId,
                    VisitorCode = visitor.VisitorCode,
                    FullName = fullName,
                    VisitCount = visitor.VisitCount,
                    Message = $"Visitor has attended {visitor.VisitCount}/{threshold} services. Needs {threshold - visitor.VisitCount} more attendance(s) to reach auto-conversion rating."
                };
            }

            // THRESHOLD REACHED! PROCEED WITH AUTO-CONVERSION
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.Now;

                // 1. Check if an active member already exists with the same name & birthdate
                var existingMember = await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.CustomerId == visitor.CustomerId &&
                        m.FirstName.ToLower() == visitor.FirstName.ToLower() &&
                        m.LastName.ToLower() == visitor.LastName.ToLower() &&
                        m.BirthDate == visitor.BirthDate &&
                        m.Status == "ACTIVE");

                Member member;
                if (existingMember != null)
                {
                    member = existingMember;
                }
                else
                {
                    // Generate next MemberCode
                    var lastMemberId = await _context.Members
                        .AsNoTracking()
                        .Select(m => (int?)m.MemberId)
                        .MaxAsync() ?? 0;

                    var memberCode = $"MEM-{lastMemberId + 1:0000}";

                    member = new Member
                    {
                        CustomerId = visitor.CustomerId,
                        MemberCode = memberCode,
                        FirstName = visitor.FirstName.Trim(),
                        MiddleName = visitor.MiddleName?.Trim() ?? string.Empty,
                        LastName = visitor.LastName.Trim(),
                        Gender = visitor.Gender?.Trim().ToUpperInvariant() ?? "UNKNOWN",
                        BirthDate = visitor.BirthDate,
                        ContactNumber = visitor.ContactNumber?.Trim() ?? string.Empty,
                        Address = visitor.Address?.Trim() ?? string.Empty,
                        CivilStatus = "SINGLE",
                        Ministry = string.IsNullOrWhiteSpace(visitor.Ministry) ? "CONGREGATION" : visitor.Ministry.Trim().ToUpperInvariant(),
                        DateJoined = visitor.FirstVisitDate ?? DateTime.Today,
                        Status = "ACTIVE",
                        PhotoPath = string.Empty,
                        CreatedDate = now,
                        UpdatedDate = null
                    };

                    _context.Members.Add(member);
                    await _context.SaveChangesAsync();
                }

                // 2. Mirror/Transfer all VisitorAttendances to official Member Attendance table
                int copiedCount = 0;
                var existingMemberAttendanceServiceIds = await _context.Attendances
                    .Where(a => a.MemberId == member.MemberId && a.ChurchServiceId.HasValue)
                    .Select(a => a.ChurchServiceId!.Value)
                    .ToListAsync();

                var serviceLookup = await _context.ChurchServices
                    .AsNoTracking()
                    .Where(s => visitor.VisitorAttendances.Select(va => va.ChurchServiceId).Contains(s.ChurchServiceId))
                    .ToDictionaryAsync(s => s.ChurchServiceId, s => s.ServiceName);

                foreach (var va in visitor.VisitorAttendances)
                {
                    if (!existingMemberAttendanceServiceIds.Contains(va.ChurchServiceId))
                    {
                        var serviceTitle = serviceLookup.TryGetValue(va.ChurchServiceId, out var sName) ? sName : "Church Service";
                        var memberAttendance = new Attendance
                        {
                            MemberId = member.MemberId,
                            ChurchServiceId = va.ChurchServiceId,
                            AttendanceDate = va.AttendanceDate,
                            Service = serviceTitle,
                            Status = string.IsNullOrWhiteSpace(va.Status) ? "PRESENT" : va.Status.ToUpperInvariant(),
                            RecordedBy = string.IsNullOrWhiteSpace(va.RecordedBy) ? recordedBy : va.RecordedBy,
                            RecordedDate = va.RecordedDate
                        };
                        _context.Attendances.Add(memberAttendance);
                        copiedCount++;
                    }
                }

                // 3. Mark Visitor as converted
                visitor.IsConvertedToMember = true;
                visitor.ConvertedMemberId = member.MemberId;
                visitor.ConversionDate = now;
                visitor.FollowUpStatus = "CONVERTED";
                visitor.Status = "CONVERTED";
                visitor.UpdatedDate = now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new VisitorPromotionResult
                {
                    WasAutoConverted = true,
                    VisitorId = visitor.VisitorId,
                    VisitorCode = visitor.VisitorCode,
                    FullName = fullName,
                    VisitCount = visitor.VisitCount,
                    MemberId = member.MemberId,
                    MemberCode = member.MemberCode,
                    ConversionDate = now,
                    CopiedAttendanceCount = copiedCount,
                    Message = $"🎉 Automatic Promotion! {fullName} reached the {threshold}-visit attendance rating and was automatically enrolled as Member {member.MemberCode}!"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new VisitorPromotionResult
                {
                    WasAutoConverted = false,
                    VisitorId = visitor.VisitorId,
                    FullName = fullName,
                    Message = $"Auto-conversion failed: {ex.Message}"
                };
            }
        }

        // =========================================================
        // AUTO-CONVERT ALL ELIGIBLE VISITORS (BATCH SCAN)
        // =========================================================
        public async Task<List<VisitorPromotionResult>> AutoConvertAllEligibleVisitorsAsync(
            int? customerId = null,
            int threshold = DefaultAttendanceThreshold,
            string recordedBy = "BATCH_AUTOMATION")
        {
            var query = _context.Visitors
                .Include(v => v.VisitorAttendances)
                .Where(v => !v.IsConvertedToMember && v.Status == "ACTIVE");

            if (customerId.HasValue && customerId.Value > 0)
            {
                query = query.Where(v => v.CustomerId == customerId.Value);
            }

            var visitors = await query.ToListAsync();
            var results = new List<VisitorPromotionResult>();

            foreach (var visitor in visitors)
            {
                var distinctServices = visitor.VisitorAttendances
                    .Select(a => a.ChurchServiceId)
                    .Distinct()
                    .Count();

                if (distinctServices >= threshold || visitor.VisitCount >= threshold)
                {
                    var result = await AutoConvertVisitorIfEligibleAsync(visitor.VisitorId, threshold, recordedBy);
                    if (result.WasAutoConverted)
                    {
                        results.Add(result);
                    }
                }
            }

            return results;
        }

        // =========================================================
        // GET CONVERSION & RATING METRICS
        // =========================================================
        public async Task<object> GetConversionMetricsAsync(int? customerId = null, int threshold = DefaultAttendanceThreshold)
        {
            var query = _context.Visitors.AsNoTracking();
            if (customerId.HasValue && customerId.Value > 0)
            {
                query = query.Where(v => v.CustomerId == customerId.Value);
            }

            var all = await query.ToListAsync();

            var total = all.Count;
            var converted = all.Count(v => v.IsConvertedToMember);
            var unconverted = all.Where(v => !v.IsConvertedToMember && v.Status == "ACTIVE").ToList();

            var tier1 = unconverted.Count(v => v.VisitCount == 1);
            var tier2 = unconverted.Count(v => v.VisitCount == 2);
            var tier3 = unconverted.Count(v => v.VisitCount == 3);
            var eligibleNow = unconverted.Count(v => v.VisitCount >= threshold);

            return new
            {
                threshold,
                totalVisitors = total,
                activeUnconverted = unconverted.Count,
                convertedToMembers = converted,
                eligibleForAutoConversion = eligibleNow,
                tiers = new
                {
                    tier1_25Percent = tier1,
                    tier2_50Percent = tier2,
                    tier3_75Percent = tier3,
                    tier4_Qualified = eligibleNow
                }
            };
        }
    }
}
