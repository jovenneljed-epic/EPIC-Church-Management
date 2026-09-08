using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Models;

[Index(nameof(CustomerId), nameof(Category))]
[Index(nameof(CustomerId), nameof(Category), nameof(Name), IsUnique = true)]
public class ChatRoom
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? MinistryId { get; set; }
    [MaxLength(20)] public string Category { get; set; } = "GROUP";
    [MaxLength(120)] public string Name { get; set; } = "";
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
[Index(nameof(RoomId), nameof(MemberId), IsUnique = true)]
public class ChatMembership
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int MemberId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsManager { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public long JoinedAfterMessageId { get; set; }
    public long LastReadMessageId { get; set; }
}
[Index(nameof(RoomId), nameof(Id))]
[Index(nameof(RoomId), nameof(SenderUserId), nameof(ClientMessageId), IsUnique = true)]
public class ChatMessage
{
    public long Id { get; set; }
    public int RoomId { get; set; }
    public int SenderUserId { get; set; }
    [MaxLength(150)] public string SenderName { get; set; } = "";
    [MaxLength(80)] public string ClientMessageId { get; set; } = "";
    [MaxLength(2000)] public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
