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
    public class MinistryMemberController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MinistryMemberController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL MINISTRY MEMBERS
        // GET: api/MinistryMember
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var assignments = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Ministry)
                .Include(mm => mm.Member)
                .OrderBy(mm => mm.Ministry!.Name)
                .ThenBy(mm => mm.Member!.LastName)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET ASSIGNMENT BY ID
        // GET: api/MinistryMember/5
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var assignment = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Ministry)
                .Include(mm => mm.Member)
                .FirstOrDefaultAsync(
                    mm => mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            return Ok(assignment);
        }

        // =========================================================
        // GET MEMBERS OF A MINISTRY
        //
        // GET:
        // api/MinistryMember/ministry/7
        // =========================================================

        [HttpGet("ministry/{ministryId:int}")]
        public async Task<IActionResult> GetByMinistry(
            int ministryId)
        {
            var ministry = await _context.Ministries
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.MinistryId == ministryId);

            if (ministry == null)
            {
                return NotFound("MINISTRY NOT FOUND.");
            }

            var assignments = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Member)
                .Where(mm =>
                    mm.MinistryId == ministryId)
                .OrderBy(mm => mm.Status)
                .ThenBy(mm => mm.Member!.LastName)
                .ToListAsync();

            return Ok(new
            {
                ministryId = ministry.MinistryId,
                ministryCode = ministry.MinistryCode,
                ministryName = ministry.Name,

                totalMembers = assignments.Count,

                activeMembers = assignments.Count(
                    mm => mm.Status == "ACTIVE"),

                inactiveMembers = assignments.Count(
                    mm => mm.Status == "INACTIVE"),

                members = assignments
            });
        }

        // =========================================================
        // GET ACTIVE MEMBERS OF A MINISTRY
        //
        // GET:
        // api/MinistryMember/ministry/7/active
        // =========================================================

        [HttpGet("ministry/{ministryId:int}/active")]
        public async Task<IActionResult> GetActiveByMinistry(
            int ministryId)
        {
            var assignments = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Member)
                .Where(mm =>
                    mm.MinistryId == ministryId &&
                    mm.Status == "ACTIVE")
                .OrderBy(mm => mm.Member!.LastName)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET MINISTRIES FOR A MEMBER
        //
        // GET:
        // api/MinistryMember/member/15
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        public async Task<IActionResult> GetByMember(
            int memberId)
        {
            var member = await _context.Members
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.MemberId == memberId);

            if (member == null)
            {
                return NotFound("MEMBER NOT FOUND.");
            }

            var assignments = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Ministry)
                .Where(mm =>
                    mm.MemberId == memberId)
                .OrderBy(mm => mm.Status)
                .ThenBy(mm => mm.Ministry!.Name)
                .ToListAsync();

            return Ok(new
            {
                memberId = member.MemberId,

                member = member,

                totalMinistries = assignments.Count,

                activeMinistries = assignments.Count(
                    mm => mm.Status == "ACTIVE"),

                assignments
            });
        }

        // =========================================================
        // CREATE / ASSIGN MEMBER
        //
        // POST:
        // api/MinistryMember
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] MinistryMember assignment)
        {
            // -----------------------------------------------------
            // VALIDATE MINISTRY
            // -----------------------------------------------------

            var ministry = await _context.Ministries
                .FirstOrDefaultAsync(
                    m => m.MinistryId ==
                         assignment.MinistryId);

            if (ministry == null)
            {
                return BadRequest(
                    "MINISTRY NOT FOUND.");
            }

            if (ministry.Status != "ACTIVE")
            {
                return BadRequest(
                    "MEMBERS CANNOT BE ASSIGNED TO AN INACTIVE MINISTRY.");
            }

            // -----------------------------------------------------
            // VALIDATE MEMBER
            // -----------------------------------------------------

            var member = await _context.Members
                .FirstOrDefaultAsync(
                    m => m.MemberId ==
                         assignment.MemberId);

            if (member == null)
            {
                return BadRequest(
                    "MEMBER NOT FOUND.");
            }

            // -----------------------------------------------------
            // PREVENT DUPLICATE ACTIVE ASSIGNMENT
            // -----------------------------------------------------

            var duplicate = await _context.MinistryMembers
                .AnyAsync(mm =>
                    mm.MinistryId ==
                        assignment.MinistryId &&

                    mm.MemberId ==
                        assignment.MemberId &&

                    mm.Status == "ACTIVE");

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "THIS MEMBER IS ALREADY ACTIVELY ASSIGNED TO THIS MINISTRY."
                });
            }

            // -----------------------------------------------------
            // CLEAN DATA
            // -----------------------------------------------------

            assignment.Role =
                assignment.Role?.Trim() ?? "";

            assignment.Position =
                assignment.Position?.Trim() ?? "";

            assignment.Notes =
                assignment.Notes?.Trim() ?? "";

            assignment.Status =
                string.IsNullOrWhiteSpace(
                    assignment.Status)

                ? "ACTIVE"

                : assignment.Status
                    .Trim()
                    .ToUpper();

            // -----------------------------------------------------
            // DATE ASSIGNED
            // -----------------------------------------------------

            if (assignment.DateAssigned == default)
            {
                assignment.DateAssigned =
                    DateTime.Now;
            }

            assignment.DateEnded = null;

            assignment.CreatedDate =
                DateTime.Now;

            assignment.UpdatedDate = null;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.MinistryMembers.Add(
                assignment);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),

                new
                {
                    id =
                        assignment.MinistryMemberId
                },

                new
                {
                    message =
                        "MEMBER ASSIGNED TO MINISTRY SUCCESSFULLY.",

                    ministryMemberId =
                        assignment.MinistryMemberId,

                    ministryId =
                        assignment.MinistryId,

                    ministry =
                        ministry.Name,

                    memberId =
                        assignment.MemberId,

                    member =
                        member,

                    role =
                        assignment.Role,

                    position =
                        assignment.Position,

                    status =
                        assignment.Status,

                    dateAssigned =
                        assignment.DateAssigned
                });
        }

        // =========================================================
        // UPDATE ASSIGNMENT
        //
        // PUT:
        // api/MinistryMember/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] MinistryMember updated)
        {
            var assignment =
                await _context.MinistryMembers
                    .FirstOrDefaultAsync(
                        mm =>
                            mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE MINISTRY
            // -----------------------------------------------------

            var ministryExists =
                await _context.Ministries
                    .AnyAsync(m =>
                        m.MinistryId ==
                        updated.MinistryId);

            if (!ministryExists)
            {
                return BadRequest(
                    "MINISTRY NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE MEMBER
            // -----------------------------------------------------

            var memberExists =
                await _context.Members
                    .AnyAsync(m =>
                        m.MemberId ==
                        updated.MemberId);

            if (!memberExists)
            {
                return BadRequest(
                    "MEMBER NOT FOUND.");
            }

            // -----------------------------------------------------
            // DUPLICATE CHECK
            // -----------------------------------------------------

            var duplicate =
                await _context.MinistryMembers
                    .AnyAsync(mm =>
                        mm.MinistryMemberId != id &&

                        mm.MinistryId ==
                            updated.MinistryId &&

                        mm.MemberId ==
                            updated.MemberId &&

                        mm.Status == "ACTIVE");

            if (duplicate)
            {
                return Conflict(
                    "THIS MEMBER IS ALREADY ACTIVELY ASSIGNED TO THIS MINISTRY.");
            }

            // -----------------------------------------------------
            // UPDATE
            // -----------------------------------------------------

            assignment.MinistryId =
                updated.MinistryId;

            assignment.MemberId =
                updated.MemberId;

            assignment.Role =
                updated.Role?.Trim() ?? "";

            assignment.Position =
                updated.Position?.Trim() ?? "";

            assignment.Notes =
                updated.Notes?.Trim() ?? "";

            assignment.Status =
                string.IsNullOrWhiteSpace(
                    updated.Status)

                ? assignment.Status

                : updated.Status
                    .Trim()
                    .ToUpper();

            if (updated.DateAssigned != default)
            {
                assignment.DateAssigned =
                    updated.DateAssigned;
            }

            if (assignment.Status == "ACTIVE")
            {
                assignment.DateEnded = null;
            }

            assignment.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY MEMBER ASSIGNMENT UPDATED SUCCESSFULLY.",

                ministryMemberId =
                    assignment.MinistryMemberId,

                ministryId =
                    assignment.MinistryId,

                memberId =
                    assignment.MemberId,

                role =
                    assignment.Role,

                position =
                    assignment.Position,

                status =
                    assignment.Status,

                updatedDate =
                    assignment.UpdatedDate
            });
        }

        // =========================================================
        // ACTIVATE ASSIGNMENT
        //
        // PUT:
        // api/MinistryMember/5/activate
        // =========================================================

        [HttpPut("{id:int}/activate")]
        public async Task<IActionResult> Activate(
            int id)
        {
            var assignment =
                await _context.MinistryMembers
                    .FirstOrDefaultAsync(
                        mm =>
                            mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            var ministry =
                await _context.Ministries
                    .FirstOrDefaultAsync(
                        m =>
                            m.MinistryId ==
                            assignment.MinistryId);

            if (ministry == null)
            {
                return BadRequest(
                    "MINISTRY NOT FOUND.");
            }

            if (ministry.Status != "ACTIVE")
            {
                return BadRequest(
                    "THE MINISTRY IS INACTIVE.");
            }

            var duplicate =
                await _context.MinistryMembers
                    .AnyAsync(mm =>
                        mm.MinistryMemberId != id &&

                        mm.MinistryId ==
                            assignment.MinistryId &&

                        mm.MemberId ==
                            assignment.MemberId &&

                        mm.Status == "ACTIVE");

            if (duplicate)
            {
                return Conflict(
                    "THIS MEMBER ALREADY HAS AN ACTIVE ASSIGNMENT IN THIS MINISTRY.");
            }

            assignment.Status = "ACTIVE";
            assignment.DateEnded = null;
            assignment.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY MEMBER ACTIVATED SUCCESSFULLY.",

                ministryMemberId =
                    assignment.MinistryMemberId,

                status =
                    assignment.Status
            });
        }

        // =========================================================
        // DEACTIVATE ASSIGNMENT
        //
        // PUT:
        // api/MinistryMember/5/deactivate
        // =========================================================

        [HttpPut("{id:int}/deactivate")]
        public async Task<IActionResult> Deactivate(
            int id)
        {
            var assignment =
                await _context.MinistryMembers
                    .FirstOrDefaultAsync(
                        mm =>
                            mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            assignment.Status = "INACTIVE";
            assignment.DateEnded = DateTime.Now;
            assignment.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY MEMBER DEACTIVATED SUCCESSFULLY.",

                ministryMemberId =
                    assignment.MinistryMemberId,

                status =
                    assignment.Status,

                dateEnded =
                    assignment.DateEnded
            });
        }

        // =========================================================
        // DELETE ASSIGNMENT
        //
        // DELETE:
        // api/MinistryMember/5
        //
        // HARD DELETE
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(
            int id)
        {
            var assignment =
                await _context.MinistryMembers
                    .FirstOrDefaultAsync(
                        mm =>
                            mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            // -----------------------------------------------------
            // Prevent accidental deletion when performance records
            // already exist.
            // -----------------------------------------------------

            var hasPerformance =
                await _context
                    .MinistryPerformanceRatings
                    .AnyAsync(p =>
                        p.MinistryMemberId == id);

            if (hasPerformance)
            {
                return BadRequest(new
                {
                    message =
                        "THIS ASSIGNMENT HAS PERFORMANCE HISTORY. DEACTIVATE IT INSTEAD OF DELETING IT."
                });
            }

            _context.MinistryMembers.Remove(
                assignment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY MEMBER ASSIGNMENT DELETED SUCCESSFULLY.",

                ministryMemberId =
                    id
            });
        }

        // =========================================================
        // GET MEMBER PERFORMANCE
        //
        // GET:
        // api/MinistryMember/5/performance
        // =========================================================

        [HttpGet("{id:int}/performance")]
        public async Task<IActionResult> GetPerformance(
            int id)
        {
            var assignment =
                await _context.MinistryMembers
                    .AsNoTracking()
                    .Include(mm => mm.Ministry)
                    .Include(mm => mm.Member)
                    .FirstOrDefaultAsync(
                        mm =>
                            mm.MinistryMemberId == id);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            var ratings =
                await _context
                    .MinistryPerformanceRatings
                    .AsNoTracking()
                    .Where(p =>
                        p.MinistryMemberId == id)
                    .OrderByDescending(
                        p => p.EvaluationDate)
                    .ToListAsync();

            var latest =
                ratings.FirstOrDefault();

            return Ok(new
            {
                ministryMemberId =
                    assignment.MinistryMemberId,

                ministryId =
                    assignment.MinistryId,

                ministry =
                    assignment.Ministry?.Name ?? "",

                memberId =
                    assignment.MemberId,

                member =
                    assignment.Member,

                role =
                    assignment.Role,

                position =
                    assignment.Position,

                status =
                    assignment.Status,

                evaluationCount =
                    ratings.Count,

                latestOverallRating =
                    latest?.OverallRating ?? 0,

                latestEvaluationDate =
                    latest?.EvaluationDate,

                ratings
            });
        }

        // =========================================================
        // MINISTRY MEMBER SUMMARY
        //
        // GET:
        // api/MinistryMember/ministry/7/summary
        // =========================================================

        [HttpGet("ministry/{ministryId:int}/summary")]
        public async Task<IActionResult> GetSummary(
            int ministryId)
        {
            var ministry =
                await _context.Ministries
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        m =>
                            m.MinistryId ==
                            ministryId);

            if (ministry == null)
            {
                return NotFound(
                    "MINISTRY NOT FOUND.");
            }

            var assignments =
                await _context.MinistryMembers
                    .AsNoTracking()
                    .Where(mm =>
                        mm.MinistryId ==
                        ministryId)
                    .ToListAsync();

            return Ok(new
            {
                ministryId =
                    ministry.MinistryId,

                ministryCode =
                    ministry.MinistryCode,

                ministryName =
                    ministry.Name,

                totalMembers =
                    assignments.Count,

                activeMembers =
                    assignments.Count(
                        mm =>
                            mm.Status ==
                            "ACTIVE"),

                inactiveMembers =
                    assignments.Count(
                        mm =>
                            mm.Status ==
                            "INACTIVE"),

                ministryStatus =
                    ministry.Status
            });
        }
    }
}