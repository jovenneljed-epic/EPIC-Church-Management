using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Models;

[Index(nameof(EventId), nameof(MemberId), IsUnique = true)]
public class FoodReservation
{
    public int FoodReservationId { get; set; }
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public int MemberId { get; set; }
    public Member Member { get; set; } = null!;
    public DateTime ReservedAt { get; set; } = DateTime.Now;
    [MaxLength(150)]
    public string RecordedBy { get; set; } = "QR SCANNER";
}
