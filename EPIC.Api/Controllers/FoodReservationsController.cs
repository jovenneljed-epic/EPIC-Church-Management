using EPIC.Api.Authorization;
using EPIC.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public sealed class FoodReservationsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("event/{eventId:int}")]
    [Permission("Events", "view")]
    public async Task<IActionResult> GetForEvent(int eventId)
    {
        var reservations = await context.FoodReservations.AsNoTracking()
            .Where(r => r.EventId == eventId).OrderBy(r => r.ReservedAt)
            .Select(r => new { r.FoodReservationId, r.MemberId, r.Member.MemberCode,
                fullName = r.Member.FirstName + " " + r.Member.LastName, r.ReservedAt }).ToListAsync();
        return Ok(new { eventId, count = reservations.Count, reservations });
    }
}
