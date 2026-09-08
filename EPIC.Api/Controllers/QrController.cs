using EPIC.Core.Interfaces;
﻿using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QrController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QrController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpPost("scan")]
        public async Task<IActionResult> Scan(
      QrScanRequest request,
      [FromServices] AttendanceStatusService attendanceStatusService,
      [FromServices] CRBreakScanService crBreakScanService,
      [FromServices] FoodReservationService foodReservationService,
      [FromServices] IPermissionService permissionService)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.QrToken))
                return BadRequest(new { success = false, message = "QR token is required." });
            request.ScanType = request.ScanType?.Trim().ToUpperInvariant() ?? "";
            request.QrToken = request.QrToken.Trim();
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized(new { success = false, message = "Authentication is required." });
            if (request.ScanType == "CR_BREAK")
            {
                if (User.Identity?.IsAuthenticated != true)
                    return Unauthorized(new { success = false, message = "Authentication is required." });
                if (!await permissionService.HasPermissionAsync(User, "CRBreakPass", "edit"))
                    return StatusCode(403, new { success = false, message = "Permission denied." });
                var (status, result) = await crBreakScanService.ScanAsync(
                    request.QrToken, request.ReferenceId, HttpContext.RequestAborted);
                return StatusCode(status, result);
            }
            if (request.ScanType != "CHURCH_SERVICE" && !QrPurpose.IsEvent(request.ScanType))
                return BadRequest(new { success = false, message = "Unsupported scan type." });
            if (!await permissionService.HasPermissionAsync(User,
                request.ScanType == "FOOD_RESERVATION" ? "Events" : "Attendance",
                request.ScanType == "FOOD_RESERVATION" ? "edit" : "create"))
                return StatusCode(403, new { success = false, message = "Permission denied." });
            if (request.ReferenceId is null or <= 0)
                return BadRequest(new { success = false, message = "Select a church service or event before scanning." });

            var qr = await _context.MemberQrIdentities
                .Include(x => x.Member)
                .FirstOrDefaultAsync(x =>
                    x.QrToken == request.QrToken &&
                    x.IsActive);


            if (qr?.Member == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid QR code."
                });
            }


            // One lock per logical attendance record across all event-purpose aliases and API replicas.
            await using var transaction = await _context.Database.BeginTransactionAsync();
            var kind = request.ScanType == "CHURCH_SERVICE" ? "CHURCH" : request.ScanType == "FOOD_RESERVATION" ? "FOOD" : "EVENT";
            var lockKey = $"EPIC:SCAN:{kind}:{request.ReferenceId}:{qr.MemberId}";
            await _context.Database.ExecuteSqlInterpolatedAsync($@"
                DECLARE @result int;
                EXEC @result = sp_getapplock @Resource={lockKey}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
                IF @result < 0 THROW 51000, 'Another scan is processing. Please try again.', 1;");
            Attendance? attendance = null;

            if (!string.Equals(qr.Member.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "This member is inactive." });


            if (request.ScanType == "CHURCH_SERVICE")
            {
                var service = await _context.ChurchServices
                    .FirstOrDefaultAsync(x =>
                        x.ChurchServiceId == request.ReferenceId);


                if (service == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Church service not found."
                    });
                }


                if (service.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { success = false, message = "This church service was cancelled." });

                var existing = await _context.Attendances
                    .FirstOrDefaultAsync(x =>
                        x.MemberId == qr.MemberId &&
                        x.ChurchServiceId == service.ChurchServiceId);


                if (service.CustomerId != qr.Member.CustomerId)
                    return BadRequest(new { success = false, message = "Member and service belong to different churches." });
                if (existing != null)
                {
                    var changed = existing.Status is not ("PRESENT" or "EARLY" or "LATE");
                    if (changed) {
                        existing.Status = attendanceStatusService.GetStatus(service, DateTime.Now);
                        existing.AttendanceDate = DateTime.Now;
                        existing.RecordedDate = DateTime.Now;
                        existing.RecordedBy = "QR SCANNER";
                    }
                    await LogAttendanceScan(qr.MemberId, request, changed ? "SUCCESS" : "ALREADY_RECORDED");
                    await transaction.CommitAsync();
                    return Ok(new
                    {
                        success = true,
                        message = changed ? "Attendance recorded." : "Attendance already recorded.",
                        member =
                            qr.Member.FirstName +
                            " " +
                            qr.Member.LastName,
                        status = existing.Status
                    });
                }


                var status =
                    attendanceStatusService.GetStatus(
                        service,
                        DateTime.Now);


                attendance = new Attendance
                {
                    MemberId = qr.MemberId,
                    ChurchServiceId = service.ChurchServiceId,
                    AttendanceDate = DateTime.Now,
                    Status = status,
                    Service = service.ServiceName,
                    RecordedBy = "QR SCANNER",
                    RecordedDate = DateTime.Now
                };


                _context.Attendances.Add(attendance);
            }
            if (QrPurpose.IsEvent(request.ScanType))
            {
                var eventData = await _context.Events
                    .FirstOrDefaultAsync(x =>
                        x.EventId == request.ReferenceId);


                if (eventData == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Event not found."
                    });
                }


                if (eventData.CustomerId != qr.Member.CustomerId)
                    return BadRequest(new { success = false, message = "Member and event belong to different churches." });
                if (!QrPurpose.Matches(request.ScanType, eventData.EventType))
                    return BadRequest(new { success = false, message = "The selected event does not match this scan purpose." });
                if (string.Equals(eventData.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { success = false, message = "This event is cancelled." });
                if (request.ScanType == "FOOD_RESERVATION")
                {
                    var (reservation, alreadyReserved) = await foodReservationService.ReserveAsync(
                        eventData.EventId, qr.MemberId, User.Identity?.Name ?? "QR SCANNER");
                    await transaction.CommitAsync();
                    return Ok(new {
                        success = true, scanType = request.ScanType, status = "RESERVED",
                        action = alreadyReserved ? "ALREADY_RESERVED" : "RESERVED",
                        member = qr.Member.FirstName + " " + qr.Member.LastName,
                        memberId = qr.MemberId, eventName = eventData.Title,
                        reservationId = reservation.FoodReservationId, reservedAt = reservation.ReservedAt,
                        message = alreadyReserved ? "This member already has a food reservation." : "Food reservation recorded."
                    });
                }

                var existingEventAttendance =
                    await _context.EventAttendances
                    .FirstOrDefaultAsync(x =>
                        x.EventId == eventData.EventId &&
                        x.MemberId == qr.MemberId);


                if (existingEventAttendance != null)
                {
                    var changed = existingEventAttendance.Status is not ("PRESENT" or "EARLY" or "LATE");
                    if (changed) {
                        existingEventAttendance.Status = GetEventAttendanceStatus(eventData);
                        existingEventAttendance.AttendanceDate = DateTime.Now;
                        existingEventAttendance.RecordedDate = DateTime.Now;
                        existingEventAttendance.RecordedBy = "QR SCANNER";
                    }
                    await LogAttendanceScan(qr.MemberId, request, changed ? "SUCCESS" : "ALREADY_RECORDED");
                    await transaction.CommitAsync();
                    return Ok(new
                    {
                        success = true,
                        message = changed ? "Event attendance recorded." : "Event attendance already recorded.",
                        member =
                            qr.Member.FirstName +
                            " " +
                            qr.Member.LastName,
                        status = existingEventAttendance.Status
                    });
                }


                var eventAttendance = new EventAttendance
                {
                    EventId = eventData.EventId,

                    MemberId = qr.MemberId,

                    Status = GetEventAttendanceStatus(eventData),

                    AttendanceDate = DateTime.Now,

                    RecordedBy = "QR SCANNER",

                    RecordedDate = DateTime.Now
                };


                _context.EventAttendances.Add(eventAttendance);


                await LogAttendanceScan(qr.MemberId, request, "SUCCESS");
                await transaction.CommitAsync();


                return Ok(new
                {
                    success = true,

                    member =
                        qr.Member.FirstName +
                        " " +
                        qr.Member.LastName,

                    scanType = request.ScanType,

                    eventName = eventData.Title,

                    status = eventAttendance.Status,

                    message = "Event attendance recorded."
                });
            }

            var log = new QrScanLog
            {
                MemberId = qr.MemberId,
                ScanType = request.ScanType,
                ReferenceId = request.ReferenceId,
                Result = "SUCCESS",
                ScanDate = DateTime.Now
            };


            _context.QrScanLogs.Add(log);


            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                member =
                    qr.Member.FirstName +
                    " " +
                    qr.Member.LastName,

                scanType = request.ScanType,

                status = attendance?.Status,

                message = "QR scan successful."
            });
        }

        private async Task LogAttendanceScan(int memberId, QrScanRequest request, string result)
        {
            _context.QrScanLogs.Add(new QrScanLog
            {
                MemberId = memberId,
                ScanType = request.ScanType,
                ReferenceId = request.ReferenceId,
                Result = result,
                ScanDate = DateTime.Now
            });
            await _context.SaveChangesAsync();
        }

        private string GetEventAttendanceStatus(Event eventData)
        {
            var now = DateTime.Now;

            var startDateTime =
                eventData.EventDate.Date +
                eventData.StartTime;


            if (now < startDateTime)
            {
                return "EARLY";
            }


            if (now <= startDateTime.AddMinutes(15))
            {
                return "PRESENT";
            }


            return "LATE";
        }
    }
}
