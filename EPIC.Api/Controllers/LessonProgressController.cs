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
    public class LessonProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LessonProgressController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/LessonProgress/lesson/{lessonId}
        // GET LESSON CONTENT + USER PROGRESS + LOCK STATUS
        // =========================================================

        [HttpGet("lesson/{lessonId:int}")]
        public async Task<IActionResult> GetLessonProgress(int lessonId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var lesson = await _context.Lessons
                .AsNoTracking()
                .Include(l => l.CourseModule)
                .FirstOrDefaultAsync(l =>
                    l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            if (lesson.CourseModule == null)
            {
                return BadRequest(new
                {
                    message = "Lesson module not found."
                });
            }

            var courseId = lesson.CourseModule.CourseId;

            var enrollment = await GetEnrollmentAsync(
                courseId,
                userId.Value);

            if (enrollment == null)
                return Forbid();
            var unlocked =
    await IsLessonUnlockedAsync(
        lessonId,
        lesson.CourseModule.CourseId,
        enrollment.CourseEnrollmentId
    );

            if (!unlocked)
            {
                return StatusCode(423, new
                {
                    message =
                        "This lesson is locked. Complete the previous lesson first.",
                    lessonId
                });
            }

            // =====================================================
            // GET ALL COURSE LESSONS IN CORRECT ORDER
            // =====================================================

            var orderedLessons = await GetOrderedCourseLessonsAsync(
                courseId);

            var currentIndex = orderedLessons.FindIndex(
                l => l.LessonId == lessonId);

            if (currentIndex < 0)
            {
                return NotFound(new
                {
                    message = "Lesson is not part of this course."
                });
            }

            // =====================================================
            // CHECK PREVIOUS LESSON
            // =====================================================

            var isLocked = false;

            if (currentIndex > 0)
            {
                var previousLesson =
                    orderedLessons[currentIndex - 1];

                var previousCompleted =
                    await IsLessonCompletedAsync(
                        enrollment.CourseEnrollmentId,
                        previousLesson.LessonId);

                if (!previousCompleted)
                    isLocked = true;
            }

            // =====================================================
            // GET CURRENT PROGRESS
            // =====================================================

            var progress = await _context.LessonProgresses
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId ==
                        enrollment.CourseEnrollmentId &&
                    p.LessonId == lessonId);

            // =====================================================
            // PREVIOUS / NEXT
            // =====================================================

            int? previousLessonId = null;
            int? nextLessonId = null;

            if (currentIndex > 0)
            {
                previousLessonId =
                    orderedLessons[currentIndex - 1].LessonId;
            }

            if (currentIndex < orderedLessons.Count - 1)
            {
                nextLessonId =
                    orderedLessons[currentIndex + 1].LessonId;
            }

            return Ok(new
            {
                lessonId = lesson.LessonId,

                title = lesson.Title,

                content = lesson.Content,

                videoUrl = lesson.VideoUrl,

                resourceUrl = lesson.ResourceUrl,

                estimatedMinutes =
                    lesson.EstimatedMinutes,

                isFreePreview =
                    lesson.IsFreePreview,

                sortOrder =
                    lesson.SortOrder,

                courseId =
                    courseId,

                courseModuleId =
                    lesson.CourseModule.CourseModuleId,

                moduleTitle =
                    lesson.CourseModule.Title,

                lessonProgressId =
                    progress?.LessonProgressId ?? 0,

                courseEnrollmentId =
                    enrollment.CourseEnrollmentId,

                progressPercentage =
                    progress?.ProgressPercentage ?? 0,

                isCompleted =
                    progress?.IsCompleted ?? false,

                startedDate =
                    progress?.StartedDate,

                completedDate =
                    progress?.CompletedDate,

                exists =
                    progress != null,

                isLocked,

                previousLessonId,

                nextLessonId,

                hasPrevious =
                    previousLessonId.HasValue,

                hasNext =
                    nextLessonId.HasValue
            });
        }

        // =========================================================
        // POST: api/LessonProgress/start/{lessonId}
        // START LESSON
        // =========================================================

        [HttpPost("start/{lessonId:int}")]
        public async Task<IActionResult> StartLesson(int lessonId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var lesson = await GetLessonAsync(lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            if (lesson.CourseModule == null)
            {
                return BadRequest(new
                {
                    message = "Lesson module not found."
                });
            }

            var courseId =
                lesson.CourseModule.CourseId;

            var enrollment = await GetEnrollmentAsync(
                courseId,
                userId.Value);

            if (enrollment == null)
            {
                return BadRequest(new
                {
                    message =
                        "You must enroll in this course first."
                });
            }
            var unlocked =
    await IsLessonUnlockedAsync(
        lessonId,
        lesson.CourseModule.CourseId,
        enrollment.CourseEnrollmentId
    );

            if (!unlocked)
            {
                return StatusCode(423, new
                {
                    message =
                        "This lesson is locked. Complete the previous lesson first.",
                    lessonId
                });
            }
            // =====================================================
            // ENFORCE LESSON ORDER
            // =====================================================

            var orderedLessons =
                await GetOrderedCourseLessonsAsync(courseId);

            var currentIndex =
                orderedLessons.FindIndex(
                    l => l.LessonId == lessonId);

            if (currentIndex < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Lesson does not belong to this course."
                });
            }

            if (currentIndex > 0)
            {
                var previousLesson =
                    orderedLessons[currentIndex - 1];

                var previousCompleted =
                    await IsLessonCompletedAsync(
                        enrollment.CourseEnrollmentId,
                        previousLesson.LessonId);

                if (!previousCompleted)
                {
                    return BadRequest(new
                    {
                        message =
                            "This lesson is locked. Complete the previous lesson first.",

                        isLocked = true,

                        requiredLessonId =
                            previousLesson.LessonId,

                        requiredLessonTitle =
                            previousLesson.Title
                    });
                }
            }

            // =====================================================
            // GET / CREATE PROGRESS
            // =====================================================

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId ==
                        enrollment.CourseEnrollmentId &&
                    p.LessonId == lessonId);

            var now = DateTime.UtcNow;

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId =
                        enrollment.CourseEnrollmentId,

                    LessonId =
                        lessonId,

                    ProgressPercentage =
                        0,

                    IsCompleted =
                        false,

                    StartedDate =
                        now,

                    CompletedDate =
                        null
                };

                _context.LessonProgresses.Add(progress);
            }
            else if (progress.StartedDate == null)
            {
                progress.StartedDate = now;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lesson started.",

                isLocked = false,

                lessonProgress =
                    CreateLessonProgressResponse(progress)
            });
        }

        // =========================================================
        // POST: api/LessonProgress/complete/{lessonId}
        // COMPLETE LESSON
        // =========================================================

        [HttpPost("complete/{lessonId:int}")]
        public async Task<IActionResult> CompleteLesson(int lessonId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var lesson = await GetLessonAsync(lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            if (lesson.CourseModule == null)
            {
                return BadRequest(new
                {
                    message = "Lesson module not found."
                });
            }

            var courseId =
                lesson.CourseModule.CourseId;

            var enrollment = await GetEnrollmentAsync(
                courseId,
                userId.Value);

            if (enrollment == null)
            {
                return BadRequest(new
                {
                    message =
                        "You must enroll in this course first."
                });
            }
            var unlocked =
    await IsLessonUnlockedAsync(
        lessonId,
        lesson.CourseModule.CourseId,
        enrollment.CourseEnrollmentId
    );

            if (!unlocked)
            {
                return StatusCode(423, new
                {
                    message =
                        "This lesson is locked. Complete the previous lesson first.",
                    lessonId
                });
            }
            // =====================================================
            // ENFORCE LESSON ORDER
            // =====================================================

            var orderedLessons =
                await GetOrderedCourseLessonsAsync(courseId);

            var currentIndex =
                orderedLessons.FindIndex(
                    l => l.LessonId == lessonId);

            if (currentIndex < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Lesson does not belong to this course."
                });
            }

            // -----------------------------------------------------
            // Cannot complete a locked lesson
            // -----------------------------------------------------

            if (currentIndex > 0)
            {
                var previousLesson =
                    orderedLessons[currentIndex - 1];

                var previousCompleted =
                    await IsLessonCompletedAsync(
                        enrollment.CourseEnrollmentId,
                        previousLesson.LessonId);

                if (!previousCompleted)
                {
                    return BadRequest(new
                    {
                        message =
                            "This lesson is locked. Complete the previous lesson first.",

                        isLocked = true,

                        requiredLessonId =
                            previousLesson.LessonId,

                        requiredLessonTitle =
                            previousLesson.Title
                    });
                }
            }

            // =====================================================
            // GET / CREATE PROGRESS
            // =====================================================

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId ==
                        enrollment.CourseEnrollmentId &&
                    p.LessonId == lessonId);

            var now = DateTime.UtcNow;

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId =
                        enrollment.CourseEnrollmentId,

                    LessonId =
                        lessonId,

                    ProgressPercentage =
                        100,

                    IsCompleted =
                        true,

                    StartedDate =
                        now,

                    CompletedDate =
                        now
                };

                _context.LessonProgresses.Add(progress);
            }
            else
            {
                progress.ProgressPercentage = 100;

                progress.IsCompleted = true;

                if (progress.StartedDate == null)
                    progress.StartedDate = now;

                progress.CompletedDate = now;
            }

            await _context.SaveChangesAsync();

            // =====================================================
            // CALCULATE COURSE PROGRESS
            // =====================================================

            var courseProgress =
                await CalculateCourseProgressAsync(
                    enrollment.CourseEnrollmentId,
                    courseId);

            // =====================================================
            // UPDATE ENROLLMENT
            // =====================================================

            enrollment.ProgressPercentage =
                courseProgress.ProgressPercentage;

            enrollment.IsCompleted =
                courseProgress.IsCompleted;

            enrollment.CompletedDate =
                courseProgress.IsCompleted
                    ? courseProgress.CompletedDate
                    : null;

            await _context.SaveChangesAsync();

            // =====================================================
            // DETERMINE NEXT LESSON
            // =====================================================

            var nextLesson =
                currentIndex < orderedLessons.Count - 1
                    ? orderedLessons[currentIndex + 1]
                    : null;

            return Ok(new
            {
                message =
                    "Lesson completed successfully.",

                lessonProgress =
                    CreateLessonProgressResponse(progress),

                courseProgress = new
                {
                    courseEnrollmentId =
                        enrollment.CourseEnrollmentId,

                    courseId =
                        enrollment.CourseId,

                    progressPercentage =
                        enrollment.ProgressPercentage,

                    isCompleted =
                        enrollment.IsCompleted,

                    completedDate =
                        enrollment.CompletedDate
                },

                nextLesson = nextLesson == null
                    ? null
                    : new
                    {
                        lessonId =
                            nextLesson.LessonId,

                        title =
                            nextLesson.Title,

                        isLocked = false
                    }
            });
        }

        // =========================================================
        // GET: api/LessonProgress/enrollment/{enrollmentId}
        // GET ALL LESSON PROGRESS
        // =========================================================

        [HttpGet("enrollment/{enrollmentId:int}")]
        public async Task<IActionResult> GetEnrollmentProgress(
            int enrollmentId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e =>
                    e.CourseEnrollmentId == enrollmentId &&
                    e.UserId == userId.Value);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Enrollment not found."
                });
            }

            var progress = await _context.LessonProgresses
                .AsNoTracking()
                .Where(p =>
                    p.CourseEnrollmentId == enrollmentId)
                .Include(p => p.Lesson)
                    .ThenInclude(l => l!.CourseModule)
                .OrderBy(p =>
                    p.Lesson!.CourseModule!.SortOrder)
                .ThenBy(p =>
                    p.Lesson!.SortOrder)
                .Select(p => new
                {
                    lessonProgressId =
                        p.LessonProgressId,

                    courseEnrollmentId =
                        p.CourseEnrollmentId,

                    lessonId =
                        p.LessonId,

                    progressPercentage =
                        p.ProgressPercentage,

                    isCompleted =
                        p.IsCompleted,

                    startedDate =
                        p.StartedDate,

                    completedDate =
                        p.CompletedDate,

                    lesson = p.Lesson == null
                        ? null
                        : new
                        {
                            lessonId =
                                p.Lesson.LessonId,

                            title =
                                p.Lesson.Title,

                            content =
                                p.Lesson.Content,

                            videoUrl =
                                p.Lesson.VideoUrl,

                            resourceUrl =
                                p.Lesson.ResourceUrl,

                            sortOrder =
                                p.Lesson.SortOrder,

                            estimatedMinutes =
                                p.Lesson.EstimatedMinutes,

                            isFreePreview =
                                p.Lesson.IsFreePreview,

                            module =
                                p.Lesson.CourseModule == null
                                    ? null
                                    : new
                                    {
                                        courseModuleId =
                                            p.Lesson.CourseModule
                                                .CourseModuleId,

                                        title =
                                            p.Lesson.CourseModule.Title,

                                        sortOrder =
                                            p.Lesson.CourseModule.SortOrder
                                    }
                        }
                })
                .ToListAsync();

            return Ok(progress);
        }

        // =========================================================
        // GET:
        // api/LessonProgress/course/{courseId}
        //
        // COMPLETE COURSE STRUCTURE + LOCK STATUS
        // =========================================================

        [HttpGet("course/{courseId:int}")]
        public async Task<IActionResult> GetCourseLessonStructure(
            int courseId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var course = await _context.Courses
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.CourseId == courseId);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            var enrollment = await GetEnrollmentAsync(
                courseId,
                userId.Value);

            if (enrollment == null)
                return Forbid();

            // =====================================================
            // GET LESSONS
            // =====================================================

            var lessons = await _context.Lessons
                .AsNoTracking()
                .Where(l =>
                    l.IsPublished &&
                    l.CourseModule != null &&
                    l.CourseModule.IsPublished &&
                    l.CourseModule.CourseId == courseId)
                .Include(l => l.CourseModule)
                .OrderBy(l =>
                    l.CourseModule!.SortOrder)
                .ThenBy(l =>
                    l.SortOrder)
                .ToListAsync();

            // =====================================================
            // GET PROGRESS
            // =====================================================

            var progressRecords =
                await _context.LessonProgresses
                    .AsNoTracking()
                    .Where(p =>
                        p.CourseEnrollmentId ==
                        enrollment.CourseEnrollmentId)
                    .ToListAsync();

            // =====================================================
            // CALCULATE LOCKING
            // =====================================================

            var lessonDtos =
                new List<LessonStructureDto>();

            var previousLessonCompleted = true;

            foreach (var lesson in lessons)
            {
                var progress =
                    progressRecords.FirstOrDefault(p =>
                        p.LessonId == lesson.LessonId);

                var lessonIsCompleted =
                    progress?.IsCompleted ?? false;

                // First lesson is unlocked.
                // Every subsequent lesson requires
                // the immediately previous lesson to be completed.
                var lessonIsLocked =
                    !previousLessonCompleted;

                lessonDtos.Add(
                    new LessonStructureDto
                    {
                        LessonId =
                            lesson.LessonId,

                        Title =
                            lesson.Title,

                        Content =
                            lesson.Content,

                        VideoUrl =
                            lesson.VideoUrl,

                        ResourceUrl =
                            lesson.ResourceUrl,

                        SortOrder =
                            lesson.SortOrder,

                        EstimatedMinutes =
                            lesson.EstimatedMinutes,

                        IsFreePreview =
                            lesson.IsFreePreview,

                        ProgressPercentage =
                            progress?.ProgressPercentage ?? 0,

                        IsCompleted =
                            lessonIsCompleted,

                        StartedDate =
                            progress?.StartedDate,

                        CompletedDate =
                            progress?.CompletedDate,

                        IsLocked =
                            lessonIsLocked
                    });

                // The NEXT lesson will only unlock when
                // THIS lesson is completed.
                previousLessonCompleted =
                    lessonIsCompleted;
            }

            // =====================================================
            // BUILD MODULES
            // =====================================================

            var modules =
                lessons
                    .GroupBy(l =>
                        l.CourseModule!)
                    .OrderBy(g =>
                        g.Key.SortOrder)
                    .Select(g => new
                    {
                        courseModuleId =
                            g.Key.CourseModuleId,

                        title =
                            g.Key.Title,

                        description =
                            g.Key.Description,

                        sortOrder =
                            g.Key.SortOrder,

                        lessons =
                            lessonDtos
                                .Where(x =>
                                    g.Any(l =>
                                        l.LessonId ==
                                        x.LessonId))
                                .ToList()
                    })
                    .ToList();

            // =====================================================
            // COURSE PROGRESS
            // =====================================================

            var totalLessons =
                lessonDtos.Count;

            var completedLessons =
                lessonDtos.Count(l =>
                    l.IsCompleted);

            var courseProgressPercentage =
                CalculatePercentage(
                    completedLessons,
                    totalLessons);

            var courseIsCompleted =
                totalLessons > 0 &&
                completedLessons == totalLessons;

            // =====================================================
            // CURRENT LESSON
            // =====================================================

            var currentLesson =
                lessonDtos.FirstOrDefault(l =>
                    !l.IsCompleted &&
                    !l.IsLocked);

            int? currentLessonId =
                currentLesson?.LessonId;

            // =====================================================
            // RETURN
            // =====================================================

            return Ok(new
            {
                courseId =
                    course.CourseId,

                courseTitle =
                    course.Title,

                shortDescription =
                    course.ShortDescription,

                courseDescription =
                    course.Description,

                thumbnailUrl =
                    course.ThumbnailUrl,

                category =
                    course.Category,

                level =
                    course.Level,

                estimatedMinutes =
                    course.EstimatedMinutes,

                courseEnrollmentId =
                    enrollment.CourseEnrollmentId,

                enrolledDate =
                    enrollment.EnrolledDate,

                progressPercentage =
                    courseProgressPercentage,

                isCompleted =
                    courseIsCompleted,

                completedDate =
                    courseIsCompleted
                        ? enrollment.CompletedDate
                        : null,

                totalLessons,

                completedLessons,

                currentLessonId,

                modules
            });
        }

        // =========================================================
        // GET:
        // api/LessonProgress/course/{courseId}/next
        // =========================================================

        [HttpGet("course/{courseId:int}/next")]
        public async Task<IActionResult> GetNextLesson(
            int courseId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return UnauthorizedResponse();

            var enrollment = await GetEnrollmentAsync(
                courseId,
                userId.Value);

            if (enrollment == null)
                return Forbid();

            var lessons =
                await GetOrderedCourseLessonsAsync(courseId);

            foreach (var lesson in lessons)
            {
                var completed =
                    await IsLessonCompletedAsync(
                        enrollment.CourseEnrollmentId,
                        lesson.LessonId);

                if (!completed)
                {
                    return Ok(new
                    {
                        hasNextLesson = true,

                        lesson = new
                        {
                            lessonId =
                                lesson.LessonId,

                            title =
                                lesson.Title,

                            content =
                                lesson.Content,

                            videoUrl =
                                lesson.VideoUrl,

                            resourceUrl =
                                lesson.ResourceUrl,

                            estimatedMinutes =
                                lesson.EstimatedMinutes,

                            isFreePreview =
                                lesson.IsFreePreview,

                            moduleId =
                                lesson.CourseModuleId,

                            moduleTitle =
                                lesson.ModuleTitle,

                            isLocked = false,

                            isCompleted = false
                        }
                    });
                }
            }

            return Ok(new
            {
                hasNextLesson = false,
                lesson = (object?)null
            });
        }

        // =========================================================
        // PRIVATE: GET ORDERED COURSE LESSONS
        // =========================================================

        private async Task<List<OrderedLesson>> GetOrderedCourseLessonsAsync(
            int courseId)
        {
            return await _context.Lessons
                .AsNoTracking()
                .Where(l =>
                    l.IsPublished &&
                    l.CourseModule != null &&
                    l.CourseModule.IsPublished &&
                    l.CourseModule.CourseId == courseId)
                .OrderBy(l =>
                    l.CourseModule!.SortOrder)
                .ThenBy(l =>
                    l.SortOrder)
                .Select(l => new OrderedLesson
                {
                    LessonId =
                        l.LessonId,

                    Title =
                        l.Title,

                    Content =
                        l.Content,

                    VideoUrl =
                        l.VideoUrl,

                    ResourceUrl =
                        l.ResourceUrl,

                    EstimatedMinutes =
                        l.EstimatedMinutes,

                    IsFreePreview =
                        l.IsFreePreview,

                    CourseModuleId =
                        l.CourseModuleId,

                    ModuleTitle =
                        l.CourseModule!.Title,

                    ModuleSortOrder =
                        l.CourseModule.SortOrder,

                    LessonSortOrder =
                        l.SortOrder
                })
                .ToListAsync();
        }

        // =========================================================
        // PRIVATE: CHECK COMPLETION
        // =========================================================

        private async Task<bool> IsLessonCompletedAsync(
            int enrollmentId,
            int lessonId)
        {
            return await _context.LessonProgresses
                .AsNoTracking()
                .AnyAsync(p =>
                    p.CourseEnrollmentId == enrollmentId &&
                    p.LessonId == lessonId &&
                    p.IsCompleted);
        }

        // =========================================================
        // PRIVATE: CURRENT USER
        // =========================================================

        private int? GetCurrentUserId()
        {
            var claim =
                User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("UserId")?.Value;

            return int.TryParse(
                claim,
                out var userId)
                ? userId
                : null;
        }

        // =========================================================
        // PRIVATE: GET LESSON
        // =========================================================

        private async Task<Lesson?> GetLessonAsync(
            int lessonId)
        {
            return await _context.Lessons
                .Include(l =>
                    l.CourseModule)
                .FirstOrDefaultAsync(l =>
                    l.LessonId == lessonId);
        }

        // =========================================================
        // PRIVATE: GET ENROLLMENT
        // =========================================================

        private async Task<CourseEnrollment?> GetEnrollmentAsync(
            int courseId,
            int userId)
        {
            return await _context.CourseEnrollments
                .FirstOrDefaultAsync(e =>
                    e.CourseId == courseId &&
                    e.UserId == userId);
        }

        // =========================================================
        // PRIVATE: CALCULATE COURSE PROGRESS
        // =========================================================

        private async Task<CourseProgressResult>
            CalculateCourseProgressAsync(
                int enrollmentId,
                int courseId)
        {
            var totalLessons =
                await _context.Lessons
                    .Where(l =>
                        l.IsPublished &&
                        l.CourseModule != null &&
                        l.CourseModule.IsPublished &&
                        l.CourseModule.CourseId ==
                            courseId)
                    .CountAsync();

            var completedLessons =
                await _context.LessonProgresses
                    .Where(p =>
                        p.CourseEnrollmentId ==
                            enrollmentId &&
                        p.IsCompleted &&
                        p.Lesson != null &&
                        p.Lesson.IsPublished &&
                        p.Lesson.CourseModule != null &&
                        p.Lesson.CourseModule.IsPublished &&
                        p.Lesson.CourseModule.CourseId ==
                            courseId)
                    .CountAsync();

            var percentage =
                CalculatePercentage(
                    completedLessons,
                    totalLessons);

            var courseIsCompleted =
                totalLessons > 0 &&
                completedLessons >= totalLessons;

            return new CourseProgressResult
            {
                TotalLessons =
                    totalLessons,

                CompletedLessons =
                    completedLessons,

                ProgressPercentage =
                    percentage,

                IsCompleted =
                    courseIsCompleted,

                CompletedDate =
                    courseIsCompleted
                        ? DateTime.UtcNow
                        : null
            };
        }

        // =========================================================
        // PRIVATE: PERCENTAGE
        // =========================================================

        private static int CalculatePercentage(
            int completed,
            int total)
        {
            if (total <= 0)
                return 0;

            return Math.Clamp(
                (int)Math.Round(
                    completed * 100.0 / total),
                0,
                100);
        }
        // =========================================================
        // PRIVATE: CHECK IF LESSON IS UNLOCKED
        //
        // Lesson 1 is always unlocked.
        //
        // Every following lesson requires the immediately
        // previous lesson to be completed.
        // =========================================================

        private async Task<bool> IsLessonUnlockedAsync(
            int lessonId,
            int courseId,
            int enrollmentId)
        {
            var orderedLessons = await _context.Lessons
                .AsNoTracking()
                .Where(l =>
                    l.IsPublished &&
                    l.CourseModule != null &&
                    l.CourseModule.IsPublished &&
                    l.CourseModule.CourseId == courseId)
                .OrderBy(l =>
                    l.CourseModule!.SortOrder)
                .ThenBy(l =>
                    l.SortOrder)
                .Select(l => new
                {
                    l.LessonId
                })
                .ToListAsync();

            var currentIndex =
                orderedLessons.FindIndex(
                    l => l.LessonId == lessonId
                );

            if (currentIndex < 0)
                return false;

            // First lesson is always unlocked
            if (currentIndex == 0)
                return true;

            var previousLessonId =
                orderedLessons[currentIndex - 1].LessonId;

            return await _context.LessonProgresses
                .AsNoTracking()
                .AnyAsync(p =>
                    p.CourseEnrollmentId == enrollmentId &&
                    p.LessonId == previousLessonId &&
                    p.IsCompleted);
        }
        // =========================================================
        // PRIVATE: PROGRESS RESPONSE
        // =========================================================

        private static object
            CreateLessonProgressResponse(
                LessonProgress progress)
        {
            return new
            {
                lessonProgressId =
                    progress.LessonProgressId,

                courseEnrollmentId =
                    progress.CourseEnrollmentId,

                lessonId =
                    progress.LessonId,

                progressPercentage =
                    progress.ProgressPercentage,

                isCompleted =
                    progress.IsCompleted,

                startedDate =
                    progress.StartedDate,

                completedDate =
                    progress.CompletedDate
            };
        }

        // =========================================================
        // PRIVATE: UNAUTHORIZED
        // =========================================================

        private UnauthorizedObjectResult
            UnauthorizedResponse()
        {
            return Unauthorized(new
            {
                message =
                    "Unable to determine the authenticated user."
            });
        }

        // =========================================================
        // DTO: ORDERED LESSON
        // =========================================================

        private sealed class OrderedLesson
        {
            public int LessonId { get; set; }

            public string Title { get; set; } = string.Empty;

            public string? Content { get; set; }

            public string? VideoUrl { get; set; }

            public string? ResourceUrl { get; set; }

            public int EstimatedMinutes { get; set; }

            public bool IsFreePreview { get; set; }

            public int CourseModuleId { get; set; }

            public string ModuleTitle { get; set; } =
                string.Empty;

            public int ModuleSortOrder { get; set; }

            public int LessonSortOrder { get; set; }
        }

        // =========================================================
        // DTO: LESSON STRUCTURE
        // =========================================================

        private sealed class LessonStructureDto
        {
            public int LessonId { get; set; }

            public string Title { get; set; } = string.Empty;

            public string? Content { get; set; }

            public string? VideoUrl { get; set; }

            public string? ResourceUrl { get; set; }

            public int SortOrder { get; set; }

            public int EstimatedMinutes { get; set; }

            public bool IsFreePreview { get; set; }

            public int ProgressPercentage { get; set; }

            public bool IsCompleted { get; set; }

            public DateTime? StartedDate { get; set; }

            public DateTime? CompletedDate { get; set; }

            public bool IsLocked { get; set; }
        }

        // =========================================================
        // RESULT CLASS
        // =========================================================

        private sealed class CourseProgressResult
        {
            public int TotalLessons { get; set; }

            public int CompletedLessons { get; set; }

            public int ProgressPercentage { get; set; }

            public bool IsCompleted { get; set; }

            public DateTime? CompletedDate { get; set; }
        }
    }
}