using EPIC.Api.Models;
using EPIC.Api.Services;
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
            .Select(m => new { m.MemberId, m.MemberCode, m.FirstName, m.MiddleName, m.LastName, m.Ministry }).ToListAsync();
        var records = await CustomerAttendance(access.CustomerId.Value).AsNoTracking()
            .Where(a => a.ChurchServiceId == serviceId).ToDictionaryAsync(a => a.MemberId);
        return Ok(new { service, ended = AutomaticAttendanceRules.HasEnded(service, DateTime.Now),
            canUpdate = await HasPermissionAsync("edit") && service.Status != "CANCELLED" && service.ServiceDate.Date <= DateTime.Today,
            attendance = members.Select(m => {
                records.TryGetValue(m.MemberId, out var record);
                return new { m.MemberId, m.MemberCode, m.Ministry, fullName = string.Join(" ", new[] {m.FirstName, m.MiddleName, m.LastName}.Where(s => !string.IsNullOrWhiteSpace(s))),
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
}
