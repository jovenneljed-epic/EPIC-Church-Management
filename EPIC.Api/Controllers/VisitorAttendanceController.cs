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
    public class VisitorAttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VisitorAttendanceController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL VISITOR ATTENDANCE
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var records = await _context.VisitorAttendances
                .Include(v => v.Visitor)
                .Include(v => v.ChurchService)
                .OrderByDescending(v => v.AttendanceDate)
                .ThenBy(v => v.Visitor!.LastName)
                .Select(v => new
                {
                    visitorAttendanceId =
                        v.VisitorAttendanceId,

                    visitorId =
                        v.VisitorId,

                    visitorCode =
                        v.Visitor!.VisitorCode,

                    fullName =
                        (v.Visitor.FirstName + " " +
                         v.Visitor.MiddleName + " " +
                         v.Visitor.LastName).Trim(),

                    churchServiceId =
                        v.ChurchServiceId,

                    churchServiceName =
                        v.ChurchService!.ServiceName,

                    serviceDate =
                        v.ChurchService.ServiceDate,

                    attendanceDate =
                        v.AttendanceDate,

                    status =
                        v.Status,

                    recordedBy =
                        v.RecordedBy,

                    recordedDate =
                        v.RecordedDate
                })
                .ToListAsync();

            return Ok(records);
        }

        // =========================================================
        // GET VISITOR ATTENDANCE BY ID
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var record =
                await _context.VisitorAttendances
                    .Include(v => v.Visitor)
                    .Include(v => v.ChurchService)
                    .Where(v =>
                        v.VisitorAttendanceId == id)
                    .Select(v => new
                    {
                        visitorAttendanceId =
                            v.VisitorAttendanceId,

                        visitorId =
                            v.VisitorId,

                        visitorCode =
                            v.Visitor!.VisitorCode,

                        fullName =
                            (v.Visitor.FirstName + " " +
                             v.Visitor.MiddleName + " " +
                             v.Visitor.LastName).Trim(),

                        churchServiceId =
                            v.ChurchServiceId,

                        churchServiceName =
                            v.ChurchService!.ServiceName,

                        serviceDate =
                            v.ChurchService.ServiceDate,

                        attendanceDate =
                            v.AttendanceDate,

                        status =
                            v.Status,

                        recordedBy =
                            v.RecordedBy,

                        recordedDate =
                            v.RecordedDate
                    })
                    .FirstOrDefaultAsync();

            if (record == null)
            {
                return NotFound(
                    "VISITOR ATTENDANCE RECORD NOT FOUND.");
            }

            return Ok(record);
        }

        // =========================================================
        // RECORD VISITOR ATTENDANCE
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> RecordAttendance(
            VisitorAttendance attendance)
        {
            // -----------------------------------------------------
            // VALIDATE VISITOR
            // -----------------------------------------------------

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId ==
                             attendance.VisitorId);

            if (visitor == null)
            {
                return NotFound(
                    "VISITOR NOT FOUND.");
            }

            if (visitor.Status != "ACTIVE")
            {
                return BadRequest(
                    "VISITOR IS NOT ACTIVE.");
            }

            // -----------------------------------------------------
            // VALIDATE CHURCH SERVICE
            // -----------------------------------------------------

            var churchService =
                await _context.ChurchServices
                    .FirstOrDefaultAsync(
                        s => s.ChurchServiceId ==
                             attendance.ChurchServiceId);

            if (churchService == null)
            {
                return NotFound(
                    "CHURCH SERVICE NOT FOUND.");
            }

            if (churchService.Status == "CANCELLED")
            {
                return BadRequest(
                    "CANCELLED CHURCH SERVICE CANNOT RECEIVE VISITOR ATTENDANCE.");
            }

            // -----------------------------------------------------
            // VALIDATE STATUS
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                attendance.Status))
            {
                attendance.Status = "PRESENT";
            }
            else
            {
                attendance.Status =
                    attendance.Status
                        .Trim()
                        .ToUpper();
            }

            string[] validStatuses =
            {
                "PRESENT",
                "LATE",
                "EARLY"
            };

            if (!validStatuses.Contains(
                attendance.Status))
            {
                return BadRequest(
                    "INVALID VISITOR ATTENDANCE STATUS. USE PRESENT, LATE, OR EARLY.");
            }

            // -----------------------------------------------------
            // AUTOMATIC SERVICE DATE
            // -----------------------------------------------------

            attendance.AttendanceDate =
                churchService.ServiceDate.Date;

            // -----------------------------------------------------
            // PREVENT DUPLICATE VISIT
            // -----------------------------------------------------

            bool duplicate =
                await _context.VisitorAttendances
                    .AnyAsync(v =>
                        v.VisitorId ==
                        attendance.VisitorId &&

                        v.ChurchServiceId ==
                        attendance.ChurchServiceId);

            if (duplicate)
            {
                return Conflict(
                    "THIS VISITOR IS ALREADY RECORDED FOR THIS CHURCH SERVICE.");
            }

            // -----------------------------------------------------
            // RECORD INFORMATION
            // -----------------------------------------------------

            attendance.RecordedBy =
                User.Identity?.Name ?? "SYSTEM";

            attendance.RecordedDate =
                DateTime.Now;

            // -----------------------------------------------------
            // SAVE VISITOR ATTENDANCE
            // -----------------------------------------------------

            _context.VisitorAttendances.Add(
                attendance);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RECALCULATE VISIT COUNT
            // -----------------------------------------------------

            int visitCount =
                await _context.VisitorAttendances
                    .Where(v =>
                        v.VisitorId ==
                        visitor.VisitorId)
                    .Select(v => v.ChurchServiceId)
                    .Distinct()
                    .CountAsync();

            visitor.VisitCount =
                visitCount;

            // -----------------------------------------------------
            // AUTOMATIC ELIGIBILITY
            // -----------------------------------------------------

            bool eligible =
                visitCount >= 4;

            if (eligible)
            {
                visitor.FollowUpStatus =
                    "ELIGIBLE";
            }
            else if (visitCount == 1)
            {
                visitor.FollowUpStatus =
                    "FOLLOW-UP";
            }

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return CreatedAtAction(
                nameof(GetById),

                new
                {
                    id =
                        attendance.VisitorAttendanceId
                },

                new
                {
                    message =
                        "VISITOR ATTENDANCE RECORDED SUCCESSFULLY.",

                    visitorAttendanceId =
                        attendance.VisitorAttendanceId,

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    fullName =
                        (visitor.FirstName + " " +
                         visitor.MiddleName + " " +
                         visitor.LastName).Trim(),

                    churchServiceId =
                        churchService.ChurchServiceId,

                    churchServiceName =
                        churchService.ServiceName,

                    attendanceDate =
                        attendance.AttendanceDate,

                    status =
                        attendance.Status,

                    visitCount =
                        visitCount,

                    membershipEligible =
                        eligible,

                    followUpStatus =
                        visitor.FollowUpStatus
                });
        }

        // =========================================================
        // GET VISITOR ATTENDANCE HISTORY
        // =========================================================

        [HttpGet("visitor/{visitorId:int}")]
        public async Task<IActionResult>
            GetVisitorHistory(int visitorId)
        {
            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == visitorId);

            if (visitor == null)
            {
                return NotFound(
                    "VISITOR NOT FOUND.");
            }

            var records =
                await _context.VisitorAttendances
                    .Include(v => v.ChurchService)
                    .Where(v =>
                        v.VisitorId == visitorId)
                    .OrderByDescending(
                        v => v.AttendanceDate)
                    .Select(v => new
                    {
                        visitorAttendanceId =
                            v.VisitorAttendanceId,

                        churchServiceId =
                            v.ChurchServiceId,

                        churchServiceName =
                            v.ChurchService!.ServiceName,

                        serviceDate =
                            v.ChurchService.ServiceDate,

                        attendanceDate =
                            v.AttendanceDate,

                        status =
                            v.Status,

                        recordedBy =
                            v.RecordedBy,

                        recordedDate =
                            v.RecordedDate
                    })
                    .ToListAsync();

            int visitCount =
                records
                    .Select(v => v.churchServiceId)
                    .Distinct()
                    .Count();

            return Ok(new
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
                    visitCount,

                membershipEligible =
                    visitCount >= 4,

                followUpStatus =
                    visitor.FollowUpStatus,

                attendance =
                    records
            });
        }

        // =========================================================
        // GET VISITORS FOR ONE CHURCH SERVICE
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        public async Task<IActionResult>
            GetByChurchService(int churchServiceId)
        {
            var churchService =
                await _context.ChurchServices
                    .FirstOrDefaultAsync(
                        s => s.ChurchServiceId ==
                             churchServiceId);

            if (churchService == null)
            {
                return NotFound(
                    "CHURCH SERVICE NOT FOUND.");
            }

            var records =
                await _context.VisitorAttendances
                    .Include(v => v.Visitor)
                    .Where(v =>
                        v.ChurchServiceId ==
                        churchServiceId)
                    .OrderBy(v => v.Visitor!.LastName)
                    .ThenBy(v => v.Visitor!.FirstName)
                    .Select(v => new
                    {
                        visitorAttendanceId =
                            v.VisitorAttendanceId,

                        visitorId =
                            v.VisitorId,

                        visitorCode =
                            v.Visitor!.VisitorCode,

                        fullName =
                            (v.Visitor.FirstName + " " +
                             v.Visitor.MiddleName + " " +
                             v.Visitor.LastName).Trim(),

                        status =
                            v.Status,

                        attendanceDate =
                            v.AttendanceDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                churchServiceId =
                    churchService.ChurchServiceId,

                serviceName =
                    churchService.ServiceName,

                serviceDate =
                    churchService.ServiceDate,

                visitorCount =
                    records.Count,

                visitors =
                    records
            });
        }

        // =========================================================
        // VISITOR ATTENDANCE SUMMARY
        // =========================================================

        [HttpGet("summary/church-service/{churchServiceId:int}")]
        public async Task<IActionResult>
            GetServiceSummary(int churchServiceId)
        {
            var churchService =
                await _context.ChurchServices
                    .FirstOrDefaultAsync(
                        s => s.ChurchServiceId ==
                             churchServiceId);

            if (churchService == null)
            {
                return NotFound(
                    "CHURCH SERVICE NOT FOUND.");
            }

            var records =
                await _context.VisitorAttendances
                    .Where(v =>
                        v.ChurchServiceId ==
                        churchServiceId)
                    .ToListAsync();

            int total =
                records.Count;

            int present =
                records.Count(
                    v => v.Status == "PRESENT");

            int late =
                records.Count(
                    v => v.Status == "LATE");

            int early =
                records.Count(
                    v => v.Status == "EARLY");

            double attendanceRate =
                total == 0
                    ? 0
                    : Math.Round(
                        ((double)
                            (present + late + early)
                            / total) * 100,
                        2);

            return Ok(new
            {
                churchServiceId =
                    churchService.ChurchServiceId,

                serviceName =
                    churchService.ServiceName,

                serviceDate =
                    churchService.ServiceDate,

                totalVisitors =
                    total,

                present =
                    present,

                late =
                    late,

                early =
                    early,

                attendanceRate =
                    attendanceRate
            });
        }

        // =========================================================
        // GET ELIGIBLE VISITORS
        // =========================================================

        [HttpGet("eligible")]
        public async Task<IActionResult>
            GetEligibleVisitors()
        {
            var visitors =
                await _context.Visitors
                    .Where(v =>
                        v.Status == "ACTIVE" &&
                        v.VisitCount >= 4)
                    .OrderBy(v => v.LastName)
                    .ThenBy(v => v.FirstName)
                    .Select(v => new
                    {
                        visitorId =
                            v.VisitorId,

                        visitorCode =
                            v.VisitorCode,

                        fullName =
                            (v.FirstName + " " +
                             v.MiddleName + " " +
                             v.LastName).Trim(),

                        visitCount =
                            v.VisitCount,

                        followUpStatus =
                            v.FollowUpStatus,

                        contactNumber =
                            v.ContactNumber,

                        firstVisitDate =
                            v.FirstVisitDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                count =
                    visitors.Count,

                visitors =
                    visitors
            });
        }

        // =========================================================
        // RECALCULATE VISITOR VISIT COUNT
        // =========================================================

        [HttpPost("visitor/{visitorId:int}/recalculate")]
        public async Task<IActionResult>
            RecalculateVisitCount(int visitorId)
        {
            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == visitorId);

            if (visitor == null)
            {
                return NotFound(
                    "VISITOR NOT FOUND.");
            }

            int visitCount =
                await _context.VisitorAttendances
                    .Where(v =>
                        v.VisitorId == visitorId)
                    .Select(v => v.ChurchServiceId)
                    .Distinct()
                    .CountAsync();

            visitor.VisitCount =
                visitCount;

            if (visitCount >= 4)
            {
                visitor.FollowUpStatus =
                    "ELIGIBLE";
            }
            else if (visitCount > 0)
            {
                visitor.FollowUpStatus =
                    "FOLLOW-UP";
            }
            else
            {
                visitor.FollowUpStatus =
                    "NEW";
            }

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "VISITOR VISIT COUNT RECALCULATED SUCCESSFULLY.",

                visitorId =
                    visitor.VisitorId,

                visitorCode =
                    visitor.VisitorCode,

                visitCount =
                    visitCount,

                membershipEligible =
                    visitCount >= 4,

                followUpStatus =
                    visitor.FollowUpStatus
            });
        }

        // =========================================================
        // DELETE VISITOR ATTENDANCE
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeleteAttendance(int id)
        {
            var record =
                await _context.VisitorAttendances
                    .FirstOrDefaultAsync(
                        v =>
                            v.VisitorAttendanceId == id);

            if (record == null)
            {
                return NotFound(
                    "VISITOR ATTENDANCE RECORD NOT FOUND.");
            }

            int visitorId =
                record.VisitorId;

            _context.VisitorAttendances.Remove(
                record);

            await _context.SaveChangesAsync();

            // Recalculate after deletion
            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == visitorId);

            if (visitor != null)
            {
                int visitCount =
                    await _context.VisitorAttendances
                        .Where(v =>
                            v.VisitorId ==
                            visitorId)
                        .Select(v =>
                            v.ChurchServiceId)
                        .Distinct()
                        .CountAsync();

                visitor.VisitCount =
                    visitCount;

                if (visitCount >= 4)
                {
                    visitor.FollowUpStatus =
                        "ELIGIBLE";
                }
                else if (visitCount > 0)
                {
                    visitor.FollowUpStatus =
                        "FOLLOW-UP";
                }
                else
                {
                    visitor.FollowUpStatus =
                        "NEW";
                }

                visitor.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message =
                    "VISITOR ATTENDANCE DELETED SUCCESSFULLY.",

                visitorAttendanceId =
                    id,

                visitorId =
                    visitorId
            });
        }
    }
}