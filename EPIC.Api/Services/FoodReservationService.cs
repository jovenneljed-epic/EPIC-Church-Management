using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services;

public sealed class FoodReservationService(ApplicationDbContext context)
{
    public async Task<(FoodReservation Reservation, bool AlreadyReserved)> ReserveAsync(int eventId, int memberId, string recordedBy)
    {
        var existing = await context.FoodReservations.AsNoTracking()
            .SingleOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);
        var reservation = existing ?? new FoodReservation { EventId = eventId, MemberId = memberId, RecordedBy = recordedBy };
        var log = new QrScanLog { MemberId = memberId, ReferenceId = eventId, ScanType = "FOOD_RESERVATION",
            Result = existing == null ? "RESERVED" : "ALREADY_RESERVED", ScanDate = DateTime.Now };
        if (existing == null) context.FoodReservations.Add(reservation);
        context.QrScanLogs.Add(log);
        try
        {
            // EF commits the reservation and its log together; the unique index prevents duplicate reservations.
            await context.SaveChangesAsync();
            return (reservation, existing != null);
        }
        catch (DbUpdateException exception) when (existing == null && exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            context.Entry(reservation).State = EntityState.Detached;
            context.Entry(log).State = EntityState.Detached;
            var winner = await context.FoodReservations.AsNoTracking()
                .SingleOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);
            if (winner == null) throw;
            log.Result = "ALREADY_RESERVED";
            context.QrScanLogs.Add(log);
            await context.SaveChangesAsync();
            return (winner, true);
        }
    }
}
