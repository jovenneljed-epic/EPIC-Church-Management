using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Models;

[Index(nameof(CustomerId), nameof(Kind), nameof(Status), nameof(Id))]
[Index(nameof(MemberId), nameof(ClientRequestId), IsUnique = true)]
public class CommunityContent
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int MemberId { get; set; }
    [MaxLength(10)] public string Kind { get; set; } = "POST";
    [MaxLength(20)] public string Category { get; set; } = "ENCOURAGEMENT";
    [MaxLength(2000)] public string Body { get; set; } = "";
    public int? ParentId { get; set; }
    public int? SharedPostId { get; set; }
    public byte[]? Photo { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "PENDING";
    [MaxLength(500)] public string ReviewReason { get; set; } = "";
    [MaxLength(80)] public string ClientRequestId { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
}
[Index(nameof(PostId), nameof(MemberId), IsUnique = true)]
public class CommunityReaction
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public int MemberId { get; set; }
    [MaxLength(20)] public string Kind { get; set; } = "LIKE";
}
[Index(nameof(MemberId), nameof(BlockedMemberId), IsUnique = true)]
public class CommunityBlock
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    public int BlockedMemberId { get; set; }
}
[Index(nameof(ContentId), nameof(MemberId), IsUnique = true)]
public class CommunityReport
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int ContentId { get; set; }
    public int MemberId { get; set; }
    [MaxLength(500)] public string Reason { get; set; } = "";
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public class CommunityReview
{
    public int Id { get; set; }
    public int ContentId { get; set; }
    public int ReviewerUserId { get; set; }
    [MaxLength(20)] public string Decision { get; set; } = "";
    [MaxLength(500)] public string Reason { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
