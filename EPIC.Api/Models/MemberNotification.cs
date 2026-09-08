using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Models;

[Index(nameof(MemberId), nameof(CreatedAt))]
[Index(nameof(MemberId), nameof(AnnouncementId), IsUnique = true)]
public class MemberNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int MemberId { get; set; }
    [MaxLength(40)] public string Kind { get; set; } = "ATTENDANCE";
    [MaxLength(200)] public string Title { get; set; } = "EPIC update";
    [MaxLength(2000)] public string Body { get; set; } = "";
    public int? ReferenceId { get; set; }
    public int? AnnouncementId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpandedAt { get; set; }
}

[Index(nameof(Token), IsUnique = true)]
public class PushDevice
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    [MaxLength(200)] public string Token { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Index(nameof(NotificationId), nameof(DeviceId), IsUnique = true)]
[Index(nameof(State), nameof(NextAttemptAt))]
public class PushDelivery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid NotificationId { get; set; }
    public int DeviceId { get; set; }
    [MaxLength(30)] public string State { get; set; } = "PENDING";
    [MaxLength(200)] public string? TicketId { get; set; }
    [MaxLength(100)] public string? ErrorCode { get; set; }
    public int Attempts { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeaseUntil { get; set; }
}
