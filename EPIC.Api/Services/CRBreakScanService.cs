using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services;

public sealed class CRBreakScanService(ApplicationDbContext context)
{
    public async Task<(int StatusCode, CRBreakScanResult Result)> ScanAsync(
        string token, int? referenceId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return (400, new(false, "QR token is required."));
        if (referenceId is <= 0)
            return (400, new(false, "Reference ID must be a positive CR pass ID or null."));

        var qr = await context.MemberQrIdentities.AsNoTracking()
            .Include(q => q.Member)
            .FirstOrDefaultAsync(q => q.QrToken == token.Trim() && q.IsActive, cancellationToken);
        if (qr?.Member == null)
            return (400, new(false, "Invalid or inactive member QR code."));
        if (!string.Equals(qr.Member.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            return (400, new(false, "This member is inactive."));

        var passes = await context.CRBreakPasses.AsNoTracking()
            .Where(p => p.MemberId == qr.MemberId && p.Status == "ACTIVE" &&
                (!referenceId.HasValue || p.CRBreakPassId == referenceId.Value))
            .Take(2).ToListAsync(cancellationToken);
        if (passes.Count == 0)
            return (404, new(false, "Active CR Break Pass not found for this member."));
        if (passes.Count != 1)
            return (409, new(false, "Multiple active CR passes found. Specify the CR pass ID."));

        var pass = passes[0];
        // Existing CR pass timestamps use server local time. Do not reinterpret stored data.
        var now = DateTime.Now;
        if (pass.ExpiresAt.HasValue && now > pass.ExpiresAt.Value)
            return (400, new(false, "This CR Break Pass has expired."));
        if (pass.TimeIn.HasValue && !pass.TimeOut.HasValue)
            return (409, new(false, "Invalid CR pass state. Ask an administrator to reset the pass."));

        var action = !pass.TimeOut.HasValue ? "TIME_OUT" : !pass.TimeIn.HasValue ? "TIME_IN" : "COMPLETED";
        var timeOut = pass.TimeOut ?? now;
        var timeIn = action == "TIME_IN" ? now : pass.TimeIn;

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        // Compare the state we read. A competing request must not silently advance it twice.
        var updated = await context.CRBreakPasses
            .Where(p => p.CRBreakPassId == pass.CRBreakPassId && p.Status == "ACTIVE" &&
                p.TimeOut == pass.TimeOut && p.TimeIn == pass.TimeIn && p.ExpiresAt == pass.ExpiresAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.TimeOut, (DateTime?)timeOut)
                .SetProperty(p => p.TimeIn, timeIn), cancellationToken);
        if (updated != 1)
            return (409, new(false, "This pass changed during scanning. Check its current status before scanning again."));

        context.QrScanLogs.Add(new QrScanLog
        {
            MemberId = qr.MemberId,
            ScanType = "CR_BREAK",
            ReferenceId = pass.CRBreakPassId,
            Result = action,
            ScanDate = now
        });
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var member = qr.Member;
        var name = $"{member.FirstName} {member.LastName}";
        var message = action switch
        {
            "TIME_OUT" => $"{name} is now OUT.",
            "TIME_IN" => $"{name} is now IN.",
            _ => $"{name} has already completed the CR break."
        };
        return (200, new(true, message, action, qr.MemberId, member.MemberCode,
            member.FirstName, member.MiddleName, member.LastName, timeOut, timeIn));
    }
}
