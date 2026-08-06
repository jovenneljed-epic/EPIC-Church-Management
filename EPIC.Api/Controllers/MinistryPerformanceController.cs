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
    public class MinistryPerformanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MinistryPerformanceController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL PERFORMANCE RATINGS
        // GET: api/MinistryPerformance
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAllRatings()
        {
            var ratings = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Ministry)
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Member)
                .OrderByDescending(p => p.EvaluationDate)
                .ToListAsync();

            return Ok(ratings);
        }

        // =========================================================
        // GET PERFORMANCE RATING BY ID
        // GET: api/MinistryPerformance/5
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRating(int id)
        {
            var rating = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Ministry)
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Member)
                .FirstOrDefaultAsync(
                    p => p.PerformanceRatingId == id);

            if (rating == null)
            {
                return NotFound(
                    "PERFORMANCE RATING NOT FOUND.");
            }

            return Ok(rating);
        }

        // =========================================================
        // GET RATINGS FOR MINISTRY MEMBER
        // GET: api/MinistryPerformance/member/5
        // =========================================================

        [HttpGet("member/{ministryMemberId:int}")]
        public async Task<IActionResult> GetMemberRatings(
            int ministryMemberId)
        {
            var assignment = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Ministry)
                .Include(mm => mm.Member)
                .FirstOrDefaultAsync(
                    mm =>
                        mm.MinistryMemberId ==
                        ministryMemberId);

            if (assignment == null)
            {
                return NotFound(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            var ratings = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Where(p =>
                    p.MinistryMemberId ==
                    ministryMemberId)
                .OrderByDescending(
                    p => p.EvaluationDate)
                .ToListAsync();

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

                ratings
            });
        }

        // =========================================================
        // GET LATEST RATING
        // GET:
        // api/MinistryPerformance/member/5/latest
        // =========================================================

        [HttpGet("member/{ministryMemberId:int}/latest")]
        public async Task<IActionResult> GetLatestRating(
            int ministryMemberId)
        {
            var rating = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Ministry)
                .Include(p => p.MinistryMember!)
                    .ThenInclude(mm => mm!.Member)
                .Where(p =>
                    p.MinistryMemberId ==
                    ministryMemberId)
                .OrderByDescending(
                    p => p.EvaluationDate)
                .FirstOrDefaultAsync();

            if (rating == null)
            {
                return NotFound(
                    "NO PERFORMANCE RATING FOUND FOR THIS MEMBER.");
            }

            return Ok(rating);
        }

        // =========================================================
        // CREATE PERFORMANCE RATING
        // POST:
        // api/MinistryPerformance
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateRating(
            MinistryPerformanceRating rating)
        {
            // -----------------------------------------------------
            // VALIDATE ASSIGNMENT
            // -----------------------------------------------------

            var assignment = await _context.MinistryMembers
                .AsNoTracking()
                .Include(mm => mm.Ministry)
                .Include(mm => mm.Member)
                .FirstOrDefaultAsync(
                    mm =>
                        mm.MinistryMemberId ==
                        rating.MinistryMemberId);

            if (assignment == null)
            {
                return BadRequest(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE RATINGS
            // -----------------------------------------------------

            if (!AreRatingsValid(rating))
            {
                return BadRequest(
                    "ALL PERFORMANCE RATINGS MUST BE BETWEEN 1 AND 5.");
            }

            // -----------------------------------------------------
            // DATE
            // -----------------------------------------------------

            if (rating.EvaluationDate == default)
            {
                rating.EvaluationDate =
                    DateTime.Now;
            }

            // -----------------------------------------------------
            // CALCULATE OVERALL
            // -----------------------------------------------------

            rating.OverallRating =
                CalculateOverallRating(rating);

            // -----------------------------------------------------
            // CLEAN TEXT
            // -----------------------------------------------------

            CleanTextFields(rating);

            // -----------------------------------------------------
            // AUDIT
            // -----------------------------------------------------

            rating.CreatedDate =
                DateTime.Now;

            rating.UpdatedDate =
                null;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.MinistryPerformanceRatings
                .Add(rating);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRating),
                new
                {
                    id =
                        rating.PerformanceRatingId
                },
                new
                {
                    message =
                        "MINISTRY PERFORMANCE RATING CREATED SUCCESSFULLY.",

                    performanceRatingId =
                        rating.PerformanceRatingId,

                    ministryMemberId =
                        rating.MinistryMemberId,

                    evaluationDate =
                        rating.EvaluationDate,

                    attendanceRating =
                        rating.AttendanceRating,

                    commitmentRating =
                        rating.CommitmentRating,

                    participationRating =
                        rating.ParticipationRating,

                    teamworkRating =
                        rating.TeamworkRating,

                    spiritualGrowthRating =
                        rating.SpiritualGrowthRating,

                    leadershipRating =
                        rating.LeadershipRating,

                    responsibilityRating =
                        rating.ResponsibilityRating,

                    overallRating =
                        rating.OverallRating
                });
        }

        // =========================================================
        // UPDATE PERFORMANCE RATING
        // PUT:
        // api/MinistryPerformance/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateRating(
            int id,
            MinistryPerformanceRating updatedRating)
        {
            var rating = await _context.MinistryPerformanceRatings
                .FirstOrDefaultAsync(
                    p =>
                        p.PerformanceRatingId ==
                        id);

            if (rating == null)
            {
                return NotFound(
                    "PERFORMANCE RATING NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE ASSIGNMENT
            // -----------------------------------------------------

            var assignmentExists =
                await _context.MinistryMembers
                    .AnyAsync(
                        mm =>
                            mm.MinistryMemberId ==
                            updatedRating.MinistryMemberId);

            if (!assignmentExists)
            {
                return BadRequest(
                    "MINISTRY MEMBER ASSIGNMENT NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE RATINGS
            // -----------------------------------------------------

            if (!AreRatingsValid(updatedRating))
            {
                return BadRequest(
                    "ALL PERFORMANCE RATINGS MUST BE BETWEEN 1 AND 5.");
            }

            // -----------------------------------------------------
            // UPDATE CORE DATA
            // -----------------------------------------------------

            rating.MinistryMemberId =
                updatedRating.MinistryMemberId;

            if (updatedRating.EvaluationDate != default)
            {
                rating.EvaluationDate =
                    updatedRating.EvaluationDate;
            }

            rating.AttendanceRating =
                updatedRating.AttendanceRating;

            rating.CommitmentRating =
                updatedRating.CommitmentRating;

            rating.ParticipationRating =
                updatedRating.ParticipationRating;

            rating.TeamworkRating =
                updatedRating.TeamworkRating;

            rating.SpiritualGrowthRating =
                updatedRating.SpiritualGrowthRating;

            rating.LeadershipRating =
                updatedRating.LeadershipRating;

            rating.ResponsibilityRating =
                updatedRating.ResponsibilityRating;

            // -----------------------------------------------------
            // RECALCULATE OVERALL
            // -----------------------------------------------------

            rating.OverallRating =
                CalculateOverallRating(rating);

            // -----------------------------------------------------
            // UPDATE TEXT
            // -----------------------------------------------------

            rating.Strengths =
                updatedRating.Strengths?.Trim() ?? "";

            rating.AreasForImprovement =
                updatedRating.AreasForImprovement?.Trim() ?? "";

            rating.Recommendations =
                updatedRating.Recommendations?.Trim() ?? "";

            rating.Evaluator =
                updatedRating.Evaluator?.Trim() ?? "";

            rating.Notes =
                updatedRating.Notes?.Trim() ?? "";

            // -----------------------------------------------------
            // AUDIT
            // -----------------------------------------------------

            rating.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY PERFORMANCE RATING UPDATED SUCCESSFULLY.",

                performanceRatingId =
                    rating.PerformanceRatingId,

                overallRating =
                    rating.OverallRating,

                updatedDate =
                    rating.UpdatedDate
            });
        }

        // =========================================================
        // DELETE PERFORMANCE RATING
        // DELETE:
        // api/MinistryPerformance/5
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRating(
            int id)
        {
            var rating =
                await _context.MinistryPerformanceRatings
                    .FirstOrDefaultAsync(
                        p =>
                            p.PerformanceRatingId ==
                            id);

            if (rating == null)
            {
                return NotFound(
                    "PERFORMANCE RATING NOT FOUND.");
            }

            _context.MinistryPerformanceRatings
                .Remove(rating);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY PERFORMANCE RATING DELETED SUCCESSFULLY.",

                performanceRatingId =
                    id
            });
        }

        // =========================================================
        // MINISTRY PERFORMANCE SUMMARY
        //
        // GET:
        // api/MinistryPerformance/ministry/5/summary
        // =========================================================

        [HttpGet("ministry/{ministryId:int}/summary")]
        public async Task<IActionResult> GetMinistrySummary(
            int ministryId)
        {
            // -----------------------------------------------------
            // MINISTRY
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // ACTIVE MEMBERS
            // -----------------------------------------------------

            var assignments =
                await _context.MinistryMembers
                    .AsNoTracking()
                    .Where(
                        mm =>
                            mm.MinistryId ==
                            ministryId &&
                            mm.Status == "ACTIVE")
                    .Include(mm => mm.Member)
                    .ToListAsync();

            // -----------------------------------------------------
            // ASSIGNMENT IDS
            // -----------------------------------------------------

            var assignmentIds =
                assignments
                    .Select(
                        mm =>
                            mm.MinistryMemberId)
                    .ToList();

            // -----------------------------------------------------
            // PERFORMANCE RATINGS
            // -----------------------------------------------------

            var ratings =
                await _context.MinistryPerformanceRatings
                    .AsNoTracking()
                    .Where(
                        p =>
                            assignmentIds.Contains(
                                p.MinistryMemberId))
                    .ToListAsync();

            // -----------------------------------------------------
            // GET LATEST RATING PER MEMBER
            // -----------------------------------------------------

            var latestRatings =
                ratings
                    .GroupBy(
                        r =>
                            r.MinistryMemberId)
                    .Select(
                        group =>
                            group
                                .OrderByDescending(
                                    r =>
                                        r.EvaluationDate)
                                .First())
                    .ToList();

            // -----------------------------------------------------
            // AVERAGE OVERALL
            // -----------------------------------------------------

            decimal averageOverall =
                latestRatings.Count == 0
                    ? 0
                    : Math.Round(
                        latestRatings.Average(
                            r =>
                                r.OverallRating),
                        2);

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                ministryId =
                    ministry.MinistryId,

                ministryCode =
                    ministry.MinistryCode,

                ministryName =
                    ministry.Name,

                totalActiveMembers =
                    assignments.Count,

                evaluatedMembers =
                    latestRatings.Count,

                membersWithoutEvaluation =
                    assignments.Count -
                    latestRatings.Count,

                averageOverallRating =
                    averageOverall,

                members =
                    assignments.Select(
                        assignment =>
                        {
                            var latest =
                                latestRatings
                                    .FirstOrDefault(
                                        r =>
                                            r.MinistryMemberId ==
                                            assignment.MinistryMemberId);

                            return new
                            {
                                ministryMemberId =
                                    assignment.MinistryMemberId,

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

                                latestEvaluationDate =
                                    latest?.EvaluationDate,

                                overallRating =
                                    latest?.OverallRating ?? 0
                            };
                        })
            });
        }

        // =========================================================
        // VALIDATE ALL RATINGS
        // =========================================================

        private static bool AreRatingsValid(
            MinistryPerformanceRating rating)
        {
            return
                IsValidRating(
                    rating.AttendanceRating) &&

                IsValidRating(
                    rating.CommitmentRating) &&

                IsValidRating(
                    rating.ParticipationRating) &&

                IsValidRating(
                    rating.TeamworkRating) &&

                IsValidRating(
                    rating.SpiritualGrowthRating) &&

                IsValidRating(
                    rating.LeadershipRating) &&

                IsValidRating(
                    rating.ResponsibilityRating);
        }

        // =========================================================
        // VALIDATE SINGLE RATING
        // =========================================================

        private static bool IsValidRating(
            decimal rating)
        {
            return rating >= 1 &&
                   rating <= 5;
        }

        // =========================================================
        // CALCULATE OVERALL RATING
        // =========================================================

        private static decimal CalculateOverallRating(
            MinistryPerformanceRating rating)
        {
            decimal total =
                rating.AttendanceRating +
                rating.CommitmentRating +
                rating.ParticipationRating +
                rating.TeamworkRating +
                rating.SpiritualGrowthRating +
                rating.LeadershipRating +
                rating.ResponsibilityRating;

            decimal average =
                total / 7m;

            return Math.Round(
                average,
                2,
                MidpointRounding.AwayFromZero);
        }

        // =========================================================
        // CLEAN TEXT FIELDS
        // =========================================================

        private static void CleanTextFields(
            MinistryPerformanceRating rating)
        {
            rating.Strengths =
                rating.Strengths?.Trim() ?? "";

            rating.AreasForImprovement =
                rating.AreasForImprovement?.Trim() ?? "";

            rating.Recommendations =
                rating.Recommendations?.Trim() ?? "";

            rating.Evaluator =
                rating.Evaluator?.Trim() ?? "";

            rating.Notes =
                rating.Notes?.Trim() ?? "";
        }
    }
}