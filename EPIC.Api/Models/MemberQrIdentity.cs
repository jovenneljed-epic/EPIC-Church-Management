namespace EPIC.Api.Models;

public class MemberQrIdentity
{
    public int Id { get; set; }

    public int MemberId { get; set; }

    public string QrToken { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }


    // Navigation
    public Member? Member { get; set; }
}