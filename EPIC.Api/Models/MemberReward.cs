using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Models;

[Index(nameof(MemberId), nameof(SourceKey), IsUnique = true)]
public class MemberReward
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    [MaxLength(100)] public string SourceKey { get; set; } = "";
    [MaxLength(200)] public string Title { get; set; } = "";
    public int Points { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Index(nameof(MemberId), nameof(CreatedAt))]
public class MemberRewardHistory
{
    public long Id { get; set; }
    public int MemberId { get; set; }
    [MaxLength(100)] public string SourceKey { get; set; } = "";
    [MaxLength(200)] public string Title { get; set; } = "";
    public int PointsChange { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
