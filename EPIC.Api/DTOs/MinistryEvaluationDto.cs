using System;
using System.Collections.Generic;

namespace EPIC.Api.DTOs
{
    public class MinistryEvaluationDto
    {
        public int MinistryId { get; set; }
        public string MinistryCode { get; set; } = string.Empty;
        public string MinistryName { get; set; } = string.Empty;
        public string MinistryHead { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string MeetingDay { get; set; } = string.Empty;
        public string MeetingTime { get; set; } = string.Empty;
        public string MeetingLocation { get; set; } = string.Empty;
        public string Category { get; set; } = "CHURCH MINISTRY";
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int TotalMinistryPoints { get; set; }
        public decimal AverageRating { get; set; } = 4.8m;
        public int HealthPercentage { get; set; } = 96;
        public string HealthTier { get; set; } = "EXEMPLARY";
        public string EncouragementVerse { get; set; } = string.Empty;
        public List<MinistryMemberEvaluationDto> Members { get; set; } = new();
    }

    public class MinistryMemberEvaluationDto
    {
        public int MemberId { get; set; }
        public int MinistryMemberId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string PhotoPath { get; set; } = string.Empty;
        public bool IsHead { get; set; }
        public decimal OverallRating { get; set; } = 4.5m;
        public decimal AttendanceRating { get; set; } = 4.5m;
        public decimal CommitmentRating { get; set; } = 4.5m;
        public decimal TeamworkRating { get; set; } = 4.5m;
        public decimal SpiritualGrowthRating { get; set; } = 4.5m;
        public decimal LeadershipRating { get; set; } = 4.5m;
        public decimal ResponsibilityRating { get; set; } = 4.5m;
        public string Evaluator { get; set; } = string.Empty;
        public DateTime? EvaluationDate { get; set; }
        public int EncouragementPoints { get; set; } = 500;
        public string HonorTitle { get; set; } = "Faithful Servant 🏆";
    }
}