using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/public/academy")]
    [AllowAnonymous]
    public class PublicAcademyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PublicAcademyController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/public/academy/curriculum
        // RETURNS ALL COURSES, MODULES, AND LESSONS FROM REAL DB
        // =========================================================
        [HttpGet("curriculum")]
        public async Task<IActionResult> GetCurriculum()
        {
            try
            {
                var courses = await _context.Courses
                    .AsNoTracking()
                    .Where(c => c.IsPublished)
                    .Include(c => c.Modules.OrderBy(m => m.SortOrder))
                        .ThenInclude(m => m.Lessons.OrderBy(l => l.SortOrder))
                    .OrderBy(c => c.CourseId)
                    .ToListAsync();

                var result = courses.Select(c => new
                {
                    courseId = c.CourseId,
                    title = c.Title,
                    code = "TRACK " + (100 + c.CourseId),
                    shortDescription = c.ShortDescription ?? "Comprehensive biblical masterclass for spiritual formation and kingdom leadership.",
                    description = c.Description,
                    category = c.Category ?? "DISCIPLESHIP",
                    level = c.Level ?? "Foundational • Open to All",
                    estimatedMinutes = c.EstimatedMinutes > 0 ? c.EstimatedMinutes : c.Modules.SelectMany(m => m.Lessons).Sum(l => l.EstimatedMinutes),
                    estimatedHours = c.EstimatedMinutes > 0
                        ? $"{Math.Ceiling(c.EstimatedMinutes / 60.0)} Hours Total"
                        : $"{Math.Ceiling(c.Modules.SelectMany(m => m.Lessons).Sum(l => l.EstimatedMinutes) / 60.0)} Hours Total",
                    totalModules = c.Modules.Count,
                    totalLessons = c.Modules.SelectMany(m => m.Lessons).Count(),
                    instructor = "Pastor Daniel Vance & EPIC Elder Council",
                    outcomes = new[]
                    {
                        "Firm foundation in biblical salvation and eternal assurance (1 John 5)",
                        "Daily quiet time, Bible study, and consistent prayer journaling",
                        "Spiritual gifts discovery and ministry activation in the local church",
                        "Christlike character, servanthood, and Great Commission mobilization"
                    },
                    modules = c.Modules.OrderBy(m => m.SortOrder).Select(m => new
                    {
                        moduleId = m.CourseModuleId,
                        moduleNumber = $"Module {m.SortOrder:D2}",
                        title = m.Title,
                        description = m.Description ?? "Biblical instruction, doctrinal foundations, and practical application.",
                        sortOrder = m.SortOrder,
                        lessonsCount = m.Lessons.Count,
                        lessons = m.Lessons.OrderBy(l => l.SortOrder).Select(l => new
                        {
                            lessonId = l.LessonId,
                            title = l.Title,
                            duration = $"{l.EstimatedMinutes} mins",
                            durationMinutes = l.EstimatedMinutes,
                            videoUrl = l.VideoUrl,
                            resourceUrl = l.ResourceUrl,
                            isFreePreview = l.IsFreePreview,
                            type = l.IsFreePreview ? "video" : (l.EstimatedMinutes > 30 ? "reading" : "workshop")
                        }).ToList()
                    }).ToList()
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading public curriculum: {ex.Message}");
                return StatusCode(500, new { message = "Unable to load academy curriculum from database.", error = ex.Message });
            }
        }

        // =========================================================
        // GET: api/public/academy/leaderboard
        // RETURNS LADDER BOARD OF SUCCESS (ALL ENROLLED NAMES & %)
        // =========================================================
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            try
            {
                // Query real CourseEnrollments joined with Users
                var enrollments = await _context.CourseEnrollments
                    .AsNoTracking()
                    .Include(e => e.Course)
                    .Include(e => e.User)
                    .OrderByDescending(e => e.ProgressPercentage)
                    .ThenByDescending(e => e.CompletedDate)
                    .ThenBy(e => e.EnrolledDate)
                    .ToListAsync();

                // Query portal demo request student enrollments
                var demoStudentEnrollments = await _context.DemoRequests
                    .AsNoTracking()
                    .Where(d => d.Position != null &&
                                (d.Position.Contains("Student") || d.Position.Contains("Cohort") || d.Position.Contains("Enroll")) ||
                                (d.Message != null && d.Message.Contains("ACADEMY ENROLLMENT")))
                    .ToListAsync();

                var leaderboardList = new List<object>();
                var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                // Add real enrollments
                foreach (var e in enrollments)
                {
                    var studentName = !string.IsNullOrWhiteSpace(e.User?.FullName)
                        ? e.User.FullName
                        : (!string.IsNullOrWhiteSpace(e.User?.Username) ? e.User.Username : "Active Scholar");

                    var key = studentName.Trim().ToLowerInvariant();
                    seenKeys.Add(key);

                    var progress = e.ProgressPercentage;
                    if (e.IsCompleted) progress = 100;

                    var (tierName, tierBadge, honorColor) = DetermineHonorTier(progress);

                    leaderboardList.Add(new
                    {
                        enrollmentId = e.CourseEnrollmentId,
                        studentName = studentName,
                        username = e.User?.Username ?? "scholar",
                        courseTitle = e.Course?.Title ?? "Foundations of Christian Discipleship",
                        courseTrack = "TRACK 101",
                        progressPercentage = progress,
                        isCompleted = e.IsCompleted || progress >= 100,
                        honorTier = tierName,
                        honorBadge = tierBadge,
                        honorColor = honorColor,
                        completedLessons = (int)Math.Round((progress / 100.0) * 60),
                        totalLessons = 60,
                        enrolledDate = e.EnrolledDate,
                        completedDate = e.CompletedDate,
                        status = progress >= 100 ? "GRADUATED" : (progress > 0 ? "IN_PROGRESS" : "ORIENTATION")
                    });
                }

                // Add portal-registered students (e.g. Ronnel Mislang Aviguetero from DemoRequest #33)
                foreach (var d in demoStudentEnrollments)
                {
                    var key = d.FullName.Trim().ToLowerInvariant();
                    if (!seenKeys.Contains(key))
                    {
                        seenKeys.Add(key);
                        // Default initial progress for active cohort applicant
                        var progress = 15;
                        var (tierName, tierBadge, honorColor) = DetermineHonorTier(progress);

                        leaderboardList.Add(new
                        {
                            enrollmentId = 1000 + d.DemoRequestId,
                            studentName = d.FullName,
                            username = d.Email.Split('@')[0],
                            courseTitle = "Foundations of Christian Discipleship",
                            courseTrack = "TRACK 101",
                            progressPercentage = progress,
                            isCompleted = false,
                            honorTier = tierName,
                            honorBadge = tierBadge,
                            honorColor = honorColor,
                            completedLessons = 9,
                            totalLessons = 60,
                            enrolledDate = d.CreatedDate,
                            completedDate = (DateTime?)null,
                            status = "IN_PROGRESS"
                        });
                    }
                }

                // Rank the students
                var ranked = leaderboardList
                    .OrderByDescending(x => ((dynamic)x).progressPercentage)
                    .ThenBy(x => ((dynamic)x).studentName)
                    .Select((item, index) => new
                    {
                        rank = index + 1,
                        rankTrophy = index == 0 ? "🥇" : index == 1 ? "🥈" : index == 2 ? "🥉" : $"#{index + 1}",
                        enrollmentId = ((dynamic)item).enrollmentId,
                        studentName = ((dynamic)item).studentName,
                        username = ((dynamic)item).username,
                        courseTitle = ((dynamic)item).courseTitle,
                        courseTrack = ((dynamic)item).courseTrack,
                        progressPercentage = ((dynamic)item).progressPercentage,
                        isCompleted = ((dynamic)item).isCompleted,
                        honorTier = ((dynamic)item).honorTier,
                        honorBadge = ((dynamic)item).honorBadge,
                        honorColor = ((dynamic)item).honorColor,
                        completedLessons = ((dynamic)item).completedLessons,
                        totalLessons = ((dynamic)item).totalLessons,
                        enrolledDate = ((dynamic)item).enrolledDate,
                        completedDate = ((dynamic)item).completedDate,
                        status = ((dynamic)item).status
                    })
                    .ToList();

                var totalScholars = ranked.Count;
                var graduatesCount = ranked.Count(s => s.isCompleted);
                var avgProgress = totalScholars > 0 ? (int)Math.Round(ranked.Average(s => s.progressPercentage)) : 0;
                var totalCompletedLessons = ranked.Sum(s => s.completedLessons);

                return Ok(new
                {
                    leaderboard = ranked,
                    summary = new
                    {
                        totalScholars = totalScholars,
                        graduatesCount = graduatesCount,
                        activeLearnersCount = totalScholars - graduatesCount,
                        averageProgress = avgProgress,
                        totalCompletedLessons = totalCompletedLessons,
                        totalAvailableLessons = 60,
                        activeCohorts = 3
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading academy leaderboard: {ex.Message}");
                return StatusCode(500, new { message = "Unable to load leaderboard.", error = ex.Message });
            }
        }

        // =========================================================
        // GET: api/public/academy/sample-lesson
        // LEAD MAGNET: FREE SAMPLE LESSON PREVIEW & STUDY OUTLINE
        // =========================================================
        [HttpGet("sample-lesson")]
        public async Task<IActionResult> GetSampleLessonOutline()
        {
            try
            {
                // Find published free preview lesson from database
                var lesson = await _context.Lessons
                    .AsNoTracking()
                    .Include(l => l.CourseModule)
                        .ThenInclude(m => m!.Course)
                    .Where(l => l.IsFreePreview && l.IsPublished)
                    .OrderBy(l => l.LessonId)
                    .FirstOrDefaultAsync();

                if (lesson == null)
                {
                    lesson = await _context.Lessons
                        .AsNoTracking()
                        .Include(l => l.CourseModule)
                            .ThenInclude(m => m!.Course)
                        .Where(l => l.IsPublished)
                        .OrderBy(l => l.LessonId)
                        .FirstOrDefaultAsync();
                }

                return Ok(new
                {
                    lessonId = lesson?.LessonId ?? 1,
                    title = lesson?.Title ?? "What Is Christian Discipleship?",
                    moduleTitle = lesson?.CourseModule?.Title ?? "Foundations of Faith",
                    courseTitle = lesson?.CourseModule?.Course?.Title ?? "Foundations of Christian Discipleship",
                    courseTrack = "TRACK 101",
                    estimatedMinutes = lesson?.EstimatedMinutes ?? 45,
                    videoUrl = !string.IsNullOrWhiteSpace(lesson?.VideoUrl) ? lesson.VideoUrl : "https://www.youtube.com/watch?v=xrXFi3Bbx90",
                    isFreePreview = true,
                    keyScripture = "Matthew 28:19-20 &bull; Luke 9:23",
                    leadMagnetTitle = "Masterclass Preview: The Biblical Call to Discipleship",
                    summary = "Discover Jesus' radical mandate for every believer to become a devoted learner, imitator, and multiplier of Christ. Learn how discipleship transforms your personal walk, spiritual discernment, and church ministry engagement.",
                    studyPoints = new[]
                    {
                        new {
                            point = "1. Discipleship Defined",
                            verse = "Matthew 28:19-20",
                            explanation = "A disciple is not just a churchgoer or convert, but a lifelong apprentice of Jesus Christ who learns His teachings, adopts His character, and reproduces His mission."
                        },
                        new {
                            point = "2. The Daily Cost of Following Jesus",
                            verse = "Luke 9:23",
                            explanation = "'Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me.' Discipleship requires voluntary surrender of selfish ambitions."
                        },
                        new {
                            point = "3. Abiding in God's Word",
                            verse = "John 8:31-32",
                            explanation = "Disciples establish an unshakeable daily habit of meditating, memorizing, and living out the Holy Scriptures, unlocking divine truth that sets them free."
                        },
                        new {
                            point = "4. Bearing Fruit that Multiplies",
                            verse = "John 15:8",
                            explanation = "True discipleship naturally bears the fruit of the Holy Spirit (love, joy, peace) and spiritual fruit by winning and discipling others for the Kingdom of God."
                        }
                    },
                    discussionQuestions = new[]
                    {
                        "What is the difference between simply attending church services and actively being a disciple of Jesus Christ?",
                        "What is one personal habit or priority you feel called to surrender to follow Jesus more deeply this week?",
                        "How can you put into practice the Great Commission in your daily family, workplace, or community routine?"
                    },
                    downloadableResource = new
                    {
                        fileName = "EPIC_Academy_Lesson01_Discipleship_Worksheet.pdf",
                        title = "Lesson 01 Study Guide & Personal Reflection Worksheet",
                        fileSize = "1.2 MB",
                        availableFree = true
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading sample lesson: {ex.Message}");
                return StatusCode(500, new { message = "Unable to load sample lesson outline.", error = ex.Message });
            }
        }

        private static (string TierName, string TierBadge, string ColorHex) DetermineHonorTier(int progress)
        {
            if (progress >= 100)
                return ("Gold Honor Scholar", "🏆 Certified Graduate", "#eab308");
            if (progress >= 70)
                return ("Silver Tier Achiever", "🌟 High Achiever", "#0284c7");
            if (progress >= 30)
                return ("Bronze Tier Disciple", "🌿 Advancing Disciple", "#059669");
            if (progress > 0)
                return ("Faithful Starter", "🚀 Disciple in Training", "#6366f1");
            return ("Orientation Scholar", "🎯 Enrolled Student", "#64748b");
        }
    }
}
