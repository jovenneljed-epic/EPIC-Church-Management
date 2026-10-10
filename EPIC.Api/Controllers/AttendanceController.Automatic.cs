using System.IO;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;

public partial class AttendanceController
{
    [HttpGet("church-service/{serviceId:int}/automatic")]
    public async Task<IActionResult> AutomaticRoster(int serviceId)
    {
        var permission = await RequirePermissionAsync("view");
        if (permission != null) return permission;
        var access = await RequireChurchAccessAsync();
        if (access.Error != null) return access.Error;
        var service = await GetCustomerChurchServiceAsync(serviceId, access.CustomerId!.Value);
        if (service == null) return NotFound();
        var nextDay = service.ServiceDate.Date.AddDays(1);
        var members = await CustomerMembers(access.CustomerId.Value).AsNoTracking()
            .Where(m => (m.Status == "ACTIVE" && (m.DateJoined ?? m.CreatedDate) < nextDay) ||
                _context.Attendances.Any(a => a.ChurchServiceId == serviceId && a.MemberId == m.MemberId))
            .OrderBy(m => m.LastName).ThenBy(m => m.FirstName)
            .Select(m => new { m.MemberId, m.MemberCode, m.FirstName, m.MiddleName, m.LastName, m.Ministry, m.PhotoPath }).ToListAsync();
        var records = await CustomerAttendance(access.CustomerId.Value).AsNoTracking()
            .Where(a => a.ChurchServiceId == serviceId).ToDictionaryAsync(a => a.MemberId);
        return Ok(new { service, ended = AutomaticAttendanceRules.HasEnded(service, DateTime.Now),
            canUpdate = await HasPermissionAsync("edit") && service.Status != "CANCELLED" && service.ServiceDate.Date <= DateTime.Today,
            attendance = members.Select(m => {
                records.TryGetValue(m.MemberId, out var record);
                return new { m.MemberId, m.MemberCode, m.Ministry, m.PhotoPath, fullName = string.Join(" ", new[] {m.FirstName, m.MiddleName, m.LastName}.Where(s => !string.IsNullOrWhiteSpace(s))),
                    status = record?.Status ?? "PENDING", attendanceId = record?.AttendanceId,
                    recordedDate = record?.RecordedDate, recordedBy = record?.RecordedBy };
            }) });
    }

    public record AttendanceCorrection(string Status, string ExpectedStatus, DateTime? ExpectedRecordedDate);

    [HttpPatch("church-service/{serviceId:int}/members/{memberId:int}")]
    public async Task<IActionResult> CorrectAttendance(int serviceId, int memberId, AttendanceCorrection request)
    {
        var permission = await RequirePermissionAsync("edit");
        if (permission != null) return permission;
        var access = await RequireChurchAccessAsync();
        if (access.Error != null) return access.Error;
        var service = await GetCustomerChurchServiceAsync(serviceId, access.CustomerId!.Value);
        if (service == null) return NotFound();
        if (service.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase) || service.ServiceDate.Date > DateTime.Today)
            return BadRequest(new { message = "Cancelled or future services cannot be updated." });
        var status = request.Status?.Trim().ToUpperInvariant();
        if (status == null || !AllowedStatuses.Contains(status)) return BadRequest(new { message = "Select a valid attendance status." });
        if (!await CustomerMembers(access.CustomerId.Value).AnyAsync(m => m.MemberId == memberId)) return NotFound();
        await using var transaction = await _context.Database.BeginTransactionAsync();
        await AutomaticAttendanceRules.Lock(_context, serviceId, memberId);
        var record = await _context.Attendances.SingleOrDefaultAsync(a => a.MemberId == memberId && a.ChurchServiceId == serviceId);
        if ((record?.Status ?? "PENDING") != request.ExpectedStatus || record?.RecordedDate != request.ExpectedRecordedDate)
            return Conflict(new { message = "This attendance changed while you were editing. Refresh and review it before updating." });
        if (record?.Status == status) return Ok(new { message = "Attendance is already up to date." });
        if (record == null) {
            record = new Attendance { MemberId = memberId, ChurchServiceId = serviceId, Service = service.ServiceName, AttendanceDate = service.ServiceDate };
            _context.Attendances.Add(record);
        }
        record.Status = status;
        record.RecordedBy = GetCurrentUserName();
        record.RecordedDate = DateTime.Now;
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { message = "Attendance updated." });
    }

    public record FaceScanRequest(int MemberId, string? ScanMode, double? Confidence);

    // =========================================================
    // EPIC SMILE FACE RECOGNITION SCANNER
    // POST /api/Attendance/church-service/{serviceId}/face-scan
    // =========================================================
    [HttpPost("church-service/{serviceId:int}/face-scan")]
    public async Task<IActionResult> FaceScan(int serviceId, [FromBody] FaceScanRequest request)
    {
        if (request == null || request.MemberId <= 0)
            return BadRequest(new { success = false, message = "Valid member ID is required for face scan." });

        var permission = await RequirePermissionAsync("edit");
        if (permission != null) return permission;
        var access = await RequireChurchAccessAsync();
        if (access.Error != null) return access.Error;

        var service = await GetCustomerChurchServiceAsync(serviceId, access.CustomerId!.Value);
        if (service == null)
            return NotFound(new { success = false, message = "Church service not found." });

        if (service.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { success = false, message = "This church service is cancelled." });

        var member = await CustomerMembers(access.CustomerId.Value).AsNoTracking()
            .FirstOrDefaultAsync(m => m.MemberId == request.MemberId);

        if (member == null)
            return NotFound(new { success = false, message = "Member not found in this church." });

        if (!string.Equals(member.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { success = false, message = $"Member '{member.FirstName} {member.LastName}' is inactive." });

        var statusService = HttpContext.RequestServices.GetRequiredService<AttendanceStatusService>();
        var calculatedStatus = statusService.GetStatus(service, DateTime.Now);

        await using var transaction = await _context.Database.BeginTransactionAsync();
        await AutomaticAttendanceRules.Lock(_context, serviceId, request.MemberId);

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.MemberId == request.MemberId && a.ChurchServiceId == serviceId);

        var alreadyRecorded = false;
        var now = DateTime.Now;

        if (existing != null)
        {
            alreadyRecorded = existing.Status is "PRESENT" or "EARLY" or "LATE";
            if (!alreadyRecorded)
            {
                existing.Status = calculatedStatus;
                existing.AttendanceDate = now;
                existing.RecordedDate = now;
                existing.RecordedBy = "SMILE FACE SCANNER";
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            var newAttendance = new Attendance
            {
                MemberId = request.MemberId,
                ChurchServiceId = serviceId,
                Service = service.ServiceName,
                AttendanceDate = now,
                Status = calculatedStatus,
                RecordedDate = now,
                RecordedBy = "SMILE FACE SCANNER"
            };
            _context.Attendances.Add(newAttendance);
            await _context.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        var finalStatus = existing?.Status ?? calculatedStatus;
        var finalRecordedDate = existing?.RecordedDate ?? now;
        var fullName = string.Join(" ", new[] { member.FirstName, member.MiddleName, member.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        return Ok(new
        {
            success = true,
            alreadyRecorded,
            message = alreadyRecorded
                ? $"Attendance already recorded earlier for {fullName}."
                : $"Attendance recorded for {fullName}.",
            memberId = member.MemberId,
            memberCode = member.MemberCode,
            fullName,
            ministry = member.Ministry ?? "",
            photoPath = member.PhotoPath ?? "",
            status = finalStatus,
            serviceName = service.ServiceName,
            recordedDate = finalRecordedDate,
            confidence = request.Confidence
        });
    }

    // =========================================================
    // BIOMETRIC DESCRIPTORS SYNC
    // =========================================================
    [HttpGet("face-biometrics")]
    public async Task<IActionResult> GetFaceBiometrics()
    {
        var permission = await RequirePermissionAsync("view");
        if (permission != null) return permission;
        var access = await RequireChurchAccessAsync();
        if (access.Error != null) return access.Error;

        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var bioFolder = Path.Combine(env.ContentRootPath, "root-uploads-biometrics");
        var filePath = Path.Combine(bioFolder, $"customer_{access.CustomerId!.Value}_faces.json");

        if (!System.IO.File.Exists(filePath))
        {
            return Ok(new { profiles = new Dictionary<string, object>() });
        }

        try
        {
            var content = await System.IO.File.ReadAllTextAsync(filePath);
            return Content(content, "application/json");
        }
        catch
        {
            return Ok(new { profiles = new Dictionary<string, object>() });
        }
    }

    [HttpPost("face-biometrics")]
    public async Task<IActionResult> SaveFaceBiometrics([FromBody] object data)
    {
        var permission = await RequirePermissionAsync("edit");
        if (permission != null) return permission;
        var access = await RequireChurchAccessAsync();
        if (access.Error != null) return access.Error;

        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var bioFolder = Path.Combine(env.ContentRootPath, "root-uploads-biometrics");
        Directory.CreateDirectory(bioFolder);
        var filePath = Path.Combine(bioFolder, $"customer_{access.CustomerId!.Value}_faces.json");

        var json = System.Text.Json.JsonSerializer.Serialize(data, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        await System.IO.File.WriteAllTextAsync(filePath, json);

        return Ok(new { success = true, message = "Biometric profiles synchronized." });
    }
}
