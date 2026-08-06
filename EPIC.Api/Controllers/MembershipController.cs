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
    public class MembershipController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MembershipController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ELIGIBLE VISITORS
        // =========================================================

        [HttpGet("eligible")]
        public async Task<IActionResult> GetEligibleVisitors()
        {
            var visitors = await _context.Visitors
                .Where(v =>
                    v.Status == "ACTIVE" &&
                    v.VisitCount >= 4 &&
                    !v.IsConvertedToMember)
                .OrderBy(v => v.LastName)
                .ThenBy(v => v.FirstName)
                .Select(v => new
                {
                    visitorId = v.VisitorId,
                    visitorCode = v.VisitorCode,

                    fullName =
                        (v.FirstName + " " +
                         v.MiddleName + " " +
                         v.LastName).Trim(),

                    visitCount = v.VisitCount,
                    followUpStatus = v.FollowUpStatus,
                    contactNumber = v.ContactNumber,
                    address = v.Address,
                    firstVisitDate = v.FirstVisitDate,

                    membershipEligible = true
                })
                .ToListAsync();

            return Ok(new
            {
                count = visitors.Count,
                visitors = visitors
            });
        }

        // =========================================================
        // GET VISITOR CONVERSION INFORMATION
        // =========================================================

        [HttpGet("visitor/{visitorId:int}")]
        public async Task<IActionResult> GetVisitorForConversion(
            int visitorId)
        {
            var visitor = await _context.Visitors
                .FirstOrDefaultAsync(v =>
                    v.VisitorId == visitorId);

            if (visitor == null)
            {
                return NotFound("VISITOR NOT FOUND.");
            }

            int visitCount = await _context.VisitorAttendances
                .Where(v =>
                    v.VisitorId == visitorId)
                .Select(v => v.ChurchServiceId)
                .Distinct()
                .CountAsync();

            return Ok(new
            {
                visitorId = visitor.VisitorId,
                visitorCode = visitor.VisitorCode,

                firstName = visitor.FirstName,
                middleName = visitor.MiddleName,
                lastName = visitor.LastName,

                gender = visitor.Gender,
                birthDate = visitor.BirthDate,

                contactNumber = visitor.ContactNumber,
                address = visitor.Address,

                ministry = visitor.Ministry,

                firstVisitDate = visitor.FirstVisitDate,

                visitCount = visitCount,

                membershipEligible =
                    visitCount >= 4,

                isConverted =
                    visitor.IsConvertedToMember,

                convertedMemberId =
                    visitor.ConvertedMemberId,

                conversionDate =
                    visitor.ConversionDate
            });
        }

        // =========================================================
        // CONVERT VISITOR TO MEMBER
        // =========================================================

        [HttpPost("convert/{visitorId:int}")]
        public async Task<IActionResult> ConvertVisitorToMember(
            int visitorId)
        {
            // -----------------------------------------------------
            // FIND VISITOR
            // -----------------------------------------------------

            var visitor = await _context.Visitors
                .FirstOrDefaultAsync(v =>
                    v.VisitorId == visitorId);

            if (visitor == null)
            {
                return NotFound("VISITOR NOT FOUND.");
            }

            // -----------------------------------------------------
            // PREVENT DOUBLE CONVERSION
            // -----------------------------------------------------

            if (visitor.IsConvertedToMember)
            {
                return Conflict(new
                {
                    message =
                        "VISITOR HAS ALREADY BEEN CONVERTED TO A MEMBER.",

                    visitorId =
                        visitor.VisitorId,

                    convertedMemberId =
                        visitor.ConvertedMemberId,

                    conversionDate =
                        visitor.ConversionDate
                });
            }

            // -----------------------------------------------------
            // RECALCULATE ACTUAL VISIT COUNT
            // -----------------------------------------------------

            int visitCount = await _context.VisitorAttendances
                .Where(v =>
                    v.VisitorId == visitorId)
                .Select(v => v.ChurchServiceId)
                .Distinct()
                .CountAsync();

            // Keep Visitor.VisitCount synchronized
            visitor.VisitCount = visitCount;

            // -----------------------------------------------------
            // REQUIRE 4 UNIQUE SERVICES
            // -----------------------------------------------------

            if (visitCount < 4)
            {
                visitor.FollowUpStatus =
                    "FOLLOW-UP";

                visitor.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return BadRequest(new
                {
                    message =
                        "VISITOR IS NOT YET ELIGIBLE FOR MEMBERSHIP.",

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    visitCount =
                        visitCount,

                    requiredVisits = 4,

                    remainingVisits =
                        4 - visitCount,

                    membershipEligible = false
                });
            }

            // -----------------------------------------------------
            // CHECK ACTIVE MEMBER WITH SAME BASIC INFORMATION
            // -----------------------------------------------------

            var existingMember =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.FirstName == visitor.FirstName &&
                        m.LastName == visitor.LastName &&
                        m.BirthDate == visitor.BirthDate &&
                        m.Status == "ACTIVE");

            if (existingMember != null)
            {
                visitor.IsConvertedToMember = true;
                visitor.ConvertedMemberId =
                    existingMember.MemberId;

                visitor.ConversionDate =
                    DateTime.Now;

                visitor.FollowUpStatus =
                    "CONVERTED";

                visitor.Status =
                    "CONVERTED";

                visitor.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Conflict(new
                {
                    message =
                        "A matching active member already exists. Visitor has been linked to that member.",

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    memberId =
                        existingMember.MemberId,

                    memberCode =
                        existingMember.MemberCode,

                    fullName =
                        (existingMember.FirstName + " " +
                         existingMember.MiddleName + " " +
                         existingMember.LastName).Trim()
                });
            }

            // -----------------------------------------------------
            // GENERATE MEMBER CODE
            // -----------------------------------------------------

            int nextNumber = 1;

            var lastMember = await _context.Members
                .OrderByDescending(m => m.MemberId)
                .FirstOrDefaultAsync();

            if (lastMember != null)
            {
                nextNumber =
                    lastMember.MemberId + 1;
            }

            string memberCode =
                $"MEM-{nextNumber:0000}";

            // -----------------------------------------------------
            // CREATE MEMBER
            // -----------------------------------------------------

            var member = new Member
            {
                MemberCode = memberCode,

                FirstName =
                    visitor.FirstName,

                MiddleName =
                    visitor.MiddleName,

                LastName =
                    visitor.LastName,

                Gender =
                    visitor.Gender,

                BirthDate =
                    visitor.BirthDate,

                ContactNumber =
                    visitor.ContactNumber,

                Address =
                    visitor.Address,

                CivilStatus =
                    "",

                Ministry =
                    visitor.Ministry,

                DateJoined =
                    DateTime.Today,

                Status =
                    "ACTIVE",

                PhotoPath =
                    "",

                CreatedDate =
                    DateTime.Now,

                UpdatedDate =
                    null
            };

            // -----------------------------------------------------
            // SAVE MEMBER
            // -----------------------------------------------------

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // UPDATE VISITOR
            // -----------------------------------------------------

            visitor.IsConvertedToMember =
                true;

            visitor.ConvertedMemberId =
                member.MemberId;

            visitor.ConversionDate =
                DateTime.Now;

            visitor.FollowUpStatus =
                "CONVERTED";

            visitor.Status =
                "CONVERTED";

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // SUCCESS RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                message =
                    "VISITOR CONVERTED TO MEMBER SUCCESSFULLY.",

                visitor = new
                {
                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    visitCount =
                        visitor.VisitCount,

                    conversionDate =
                        visitor.ConversionDate
                },

                member = new
                {
                    memberId =
                        member.MemberId,

                    memberCode =
                        member.MemberCode,

                    fullName =
                        (member.FirstName + " " +
                         member.MiddleName + " " +
                         member.LastName).Trim(),

                    status =
                        member.Status,

                    dateJoined =
                        member.DateJoined
                }
            });
        }

        // =========================================================
        // GET CONVERSION RECORD
        // =========================================================

        [HttpGet("conversion/{visitorId:int}")]
        public async Task<IActionResult> GetConversionRecord(
            int visitorId)
        {
            var visitor = await _context.Visitors
                .FirstOrDefaultAsync(v =>
                    v.VisitorId == visitorId);

            if (visitor == null)
            {
                return NotFound("VISITOR NOT FOUND.");
            }

            if (!visitor.IsConvertedToMember ||
                visitor.ConvertedMemberId == null)
            {
                return NotFound(
                    "VISITOR HAS NOT BEEN CONVERTED TO A MEMBER.");
            }

            var member = await _context.Members
                .FirstOrDefaultAsync(m =>
                    m.MemberId ==
                    visitor.ConvertedMemberId.Value);

            if (member == null)
            {
                return NotFound(
                    "CONVERTED MEMBER RECORD NOT FOUND.");
            }

            return Ok(new
            {
                visitor = new
                {
                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    fullName =
                        (visitor.FirstName + " " +
                         visitor.MiddleName + " " +
                         visitor.LastName).Trim(),

                    visitCount =
                        visitor.VisitCount,

                    conversionDate =
                        visitor.ConversionDate
                },

                member = new
                {
                    memberId =
                        member.MemberId,

                    memberCode =
                        member.MemberCode,

                    fullName =
                        (member.FirstName + " " +
                         member.MiddleName + " " +
                         member.LastName).Trim(),

                    status =
                        member.Status,

                    dateJoined =
                        member.DateJoined
                }
            });
        }
    }
}