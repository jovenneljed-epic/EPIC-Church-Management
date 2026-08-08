using System;

namespace EPIC.Api.Models
{
    public class CRBreakPass
    {
        public int CRBreakPassId { get; set; }

        public int MemberId { get; set; }

        public string PassCode { get; set; } = string.Empty;

        public string QrToken { get; set; } = string.Empty;

        public string Status { get; set; } = "ACTIVE";

        public DateTime IssuedAt { get; set; }

        public DateTime? TimeOut { get; set; }

        public DateTime? TimeIn { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public string? CreatedBy { get; set; }

        public Member? Member { get; set; }
    }
}