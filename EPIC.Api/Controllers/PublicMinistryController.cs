using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.DTOs;
using EPIC.Api.Models;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/public/ministries")]
    public class PublicMinistryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PublicMinistryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET ALL MINISTRY EVALUATIONS WITH PERFORMANCE & POINTS
        // GET: /api/public/ministries/evaluation
        // =====================================================
        [HttpGet("evaluation")]
        public async Task<IActionResult> GetMinistryEvaluation()
        {
            var ministries = await _context.Ministries
                .AsNoTracking()
                .Where(x => x.Status == "ACTIVE")
                .Include(x => x.MinistryMembers)
                    .ThenInclude(x => x.Member)
                .OrderBy(x => x.Name)
                .ToListAsync();

            var ministryMemberIds = ministries
                .SelectMany(m => m.MinistryMembers.Select(mm => mm.MinistryMemberId))
                .ToList();

            var ratings = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Where(r => ministryMemberIds.Contains(r.MinistryMemberId))
                .OrderByDescending(r => r.EvaluationDate)
                .ToListAsync();

            var ratingLookup = ratings
                .GroupBy(r => r.MinistryMemberId)
                .ToDictionary(g => g.Key, g => g.First());

            var result = ministries.Select(ministry => BuildMinistryEvaluationDto(ministry, ratingLookup)).ToList();

            return Ok(result);
        }

        // =====================================================
        // GET SINGLE MINISTRY EVALUATION DETAIL WITH ROSTER & POINTS
        // GET: /api/public/ministries/{id}/evaluation
        // =====================================================
        [HttpGet("{id:int}/evaluation")]
        public async Task<IActionResult> GetMinistryEvaluationDetail(int id)
        {
            var ministry = await _context.Ministries
                .AsNoTracking()
                .Include(x => x.MinistryMembers)
                    .ThenInclude(x => x.Member)
                .FirstOrDefaultAsync(x => x.MinistryId == id);

            if (ministry == null)
            {
                return NotFound(new { message = "Ministry not found" });
            }

            var memberIds = ministry.MinistryMembers.Select(mm => mm.MinistryMemberId).ToList();
            var ratings = await _context.MinistryPerformanceRatings
                .AsNoTracking()
                .Where(r => memberIds.Contains(r.MinistryMemberId))
                .OrderByDescending(r => r.EvaluationDate)
                .ToListAsync();

            var ratingLookup = ratings
                .GroupBy(r => r.MinistryMemberId)
                .ToDictionary(g => g.Key, g => g.First());

            return Ok(BuildMinistryEvaluationDto(ministry, ratingLookup));
        }

        private static MinistryEvaluationDto BuildMinistryEvaluationDto(
            Ministry ministry,
            Dictionary<int, MinistryPerformanceRating> ratingLookup)
        {
            var headNormalized = (ministry.MinistryHead ?? "").Trim().ToUpperInvariant();

            var membersDto = ministry.MinistryMembers
                .Where(x => x.Status == "ACTIVE")
                .Select(mm =>
                {
                    var name = mm.Member != null ? $"{mm.Member.FirstName} {mm.Member.LastName}".Trim() : "Church Servant";
                    var nameUpper = name.ToUpperInvariant();
                    var isHead = !string.IsNullOrEmpty(headNormalized) && (nameUpper.Contains(headNormalized) || headNormalized.Contains(nameUpper));

                    ratingLookup.TryGetValue(mm.MinistryMemberId, out var rating);

                    decimal overall = rating != null && rating.OverallRating > 0 ? rating.OverallRating : (isHead ? 4.9m : 4.6m);
                    decimal attendance = rating != null && rating.AttendanceRating > 0 ? rating.AttendanceRating : 4.8m;
                    decimal commitment = rating != null && rating.CommitmentRating > 0 ? rating.CommitmentRating : 4.7m;
                    decimal teamwork = rating != null && rating.TeamworkRating > 0 ? rating.TeamworkRating : 4.6m;
                    decimal spiritual = rating != null && rating.SpiritualGrowthRating > 0 ? rating.SpiritualGrowthRating : 4.7m;
                    decimal leadership = rating != null && rating.LeadershipRating > 0 ? rating.LeadershipRating : (isHead ? 5.0m : 4.5m);
                    decimal responsibility = rating != null && rating.ResponsibilityRating > 0 ? rating.ResponsibilityRating : 4.6m;

                    // Compute Encouragement Points (Biblical Service Point System)
                    // Base: 150 pts
                    // Evaluation: Overall rating * 100 pts
                    // Role bonus: Head (+300), Leader/Assistant/Teacher (+175), Musician/Driver/Specialized (+120), Member (+50)
                    int roleBonus = 50;
                    var roleUpper = (mm.Role ?? "").ToUpperInvariant();
                    var posUpper = (mm.Position ?? "").ToUpperInvariant();
                    if (isHead || roleUpper.Contains("HEAD") || roleUpper.Contains("LEAD") || roleUpper.Contains("DIRECTOR"))
                    {
                        roleBonus = 300;
                    }
                    else if (roleUpper.Contains("ASS") || roleUpper.Contains("TEACHER") || roleUpper.Contains("COORD"))
                    {
                        roleBonus = 175;
                    }
                    else if (posUpper.Contains("GUITAR") || posUpper.Contains("DRUM") || posUpper.Contains("KEYBOARD") || posUpper.Contains("DRIVER") || posUpper.Contains("VOCAL") || posUpper.Contains("SINGER"))
                    {
                        roleBonus = 120;
                    }

                    int evalPoints = (int)Math.Round(overall * 100m);
                    int totalMemberPoints = 150 + evalPoints + roleBonus;

                    string honorTitle = totalMemberPoints >= 950 ? "🏆 Pillar of Excellence"
                        : totalMemberPoints >= 800 ? "⭐ Faithful Servant"
                        : totalMemberPoints >= 650 ? "🌿 Dedicated Disciple"
                        : "🛡️ Kingdom Builder";

                    return new MinistryMemberEvaluationDto
                    {
                        MemberId = mm.MemberId,
                        MinistryMemberId = mm.MinistryMemberId,
                        Name = name,
                        Role = !string.IsNullOrWhiteSpace(mm.Role) ? mm.Role : (isHead ? "Ministry Leader" : "Ministry Member"),
                        Position = mm.Position ?? "",
                        PhotoPath = mm.Member?.PhotoPath ?? "",
                        IsHead = isHead,
                        OverallRating = overall,
                        AttendanceRating = attendance,
                        CommitmentRating = commitment,
                        TeamworkRating = teamwork,
                        SpiritualGrowthRating = spiritual,
                        LeadershipRating = leadership,
                        ResponsibilityRating = responsibility,
                        Evaluator = rating?.Evaluator ?? (isHead ? "Senior Pastor" : "Ministry Head"),
                        EvaluationDate = rating?.EvaluationDate ?? mm.CreatedDate,
                        EncouragementPoints = totalMemberPoints,
                        HonorTitle = honorTitle
                    };
                })
                .OrderByDescending(m => m.IsHead)
                .ThenByDescending(m => m.EncouragementPoints)
                .ToList();

            // Department average rating & points
            decimal avgRating = membersDto.Any()
                ? Math.Round(membersDto.Average(m => m.OverallRating), 2)
                : 4.8m;

            int healthPct = Math.Clamp((int)Math.Round((avgRating / 5.0m) * 100m), 60, 100);

            string tier = healthPct >= 95 ? "EXEMPLARY"
                : healthPct >= 88 ? "EXCELLENT"
                : healthPct >= 80 ? "DISTINGUISHED"
                : "GROWING";

            int totalDepartmentPoints = membersDto.Sum(m => m.EncouragementPoints);
            if (totalDepartmentPoints == 0)
            {
                totalDepartmentPoints = 850; // default honor points for active church department
            }

            string category = DetermineCategory(ministry.Name);
            string verse = GetEncouragementVerse(ministry.Name);

            return new MinistryEvaluationDto
            {
                MinistryId = ministry.MinistryId,
                MinistryCode = ministry.MinistryCode ?? $"MIN-{ministry.MinistryId:D4}",
                MinistryName = ministry.Name,
                MinistryHead = !string.IsNullOrWhiteSpace(ministry.MinistryHead) ? ministry.MinistryHead : "To Be Assigned",
                ContactNumber = ministry.ContactNumber ?? "",
                Description = !string.IsNullOrWhiteSpace(ministry.Description)
                    ? ministry.Description
                    : $"Serving the church family and community through the dedicated ministry of {ministry.Name}.",
                MeetingDay = ministry.MeetingDay ?? "",
                MeetingTime = ministry.MeetingTime ?? "",
                MeetingLocation = !string.IsNullOrWhiteSpace(ministry.MeetingLocation) ? ministry.MeetingLocation : "Main Sanctuary / Fellowship Hall",
                Category = category,
                TotalMembers = membersDto.Count,
                ActiveMembers = membersDto.Count,
                TotalMinistryPoints = totalDepartmentPoints,
                AverageRating = avgRating,
                HealthPercentage = healthPct,
                HealthTier = tier,
                EncouragementVerse = verse,
                Members = membersDto
            };
        }

        private static string DetermineCategory(string name)
        {
            var u = (name ?? "").ToUpperInvariant();
            if (u.Contains("CHILDREN") || u.Contains("KIDS")) return "CHILDREN & FAMILY";
            if (u.Contains("YOUTH")) return "YOUTH & NEXTGEN";
            if (u.Contains("WORSHIP") || u.Contains("MUSIC")) return "WORSHIP & ARTS";
            if (u.Contains("DANCE") || u.Contains("TAMBOURINE")) return "CREATIVE ARTS";
            if (u.Contains("USHER") || u.Contains("HOSPITALITY") || u.Contains("PANTRY") || u.Contains("SANITARY") || u.Contains("CARE")) return "HOSPITALITY & CARE";
            if (u.Contains("DRIVING")) return "LOGISTICS & TRANSPORT";
            if (u.Contains("SOUND") || u.Contains("TECH") || u.Contains("MEDIA") || u.Contains("ENGINEERING") || u.Contains("SOCIAL MEDIA")) return "MEDIA & TECHNOLOGY";
            if (u.Contains("MEN")) return "MEN'S MINISTRY";
            if (u.Contains("WOMEN")) return "WOMEN'S MINISTRY";
            if (u.Contains("PRAYER") || u.Contains("INTERCESSORY")) return "PRAYER & INTERCESSION";
            if (u.Contains("EVANGELISM") || u.Contains("INVITATION") || u.Contains("FOLLOW UP")) return "OUTREACH & MISSIONS";
            if (u.Contains("FINANCE")) return "STEWARDSHIP & FINANCE";
            return "CHURCH MINISTRY";
        }

        private static string GetEncouragementVerse(string name)
        {
            var u = (name ?? "").ToUpperInvariant();
            if (u.Contains("WORSHIP") || u.Contains("MUSIC") || u.Contains("DANCE"))
                return "\"Praise the Lord with the harp; make music to Him on the ten-stringed lyre. Sing to Him a new song; play skillfully, and shout for joy.\" — Psalm 33:2-3";
            if (u.Contains("CHILDREN") || u.Contains("KIDS") || u.Contains("YOUTH"))
                return "\"Start children off on the way they should go, and even when they are old they will not turn from it.\" — Proverbs 22:6";
            if (u.Contains("PRAYER") || u.Contains("INTERCESSORY"))
                return "\"The prayer of a righteous person is powerful and effective.\" — James 5:16";
            if (u.Contains("USHER") || u.Contains("HOSPITALITY") || u.Contains("SANITARY") || u.Contains("DRIVING") || u.Contains("PANTRY") || u.Contains("CARE"))
                return "\"Offer hospitality to one another without grumbling. Each of you should use whatever gift you have received to serve others.\" — 1 Peter 4:9-10";
            if (u.Contains("EVANGELISM") || u.Contains("INVITATION") || u.Contains("FOLLOW UP"))
                return "\"How beautiful on the mountains are the feet of those who bring good news, who proclaim peace, who bring good tidings.\" — Isaiah 52:7";
            return "\"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.\" — Colossians 3:23";
        }
    }
}