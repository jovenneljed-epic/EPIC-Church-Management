using System;

namespace EPIC.Api.Models
{
    public class BlogReaction
    {
        public int Id { get; set; }

        public string ArticleId { get; set; } = "";

        public int Likes { get; set; } = 0;

        public int Hearts { get; set; } = 0;

        public int Amens { get; set; } = 0;

        public int Insights { get; set; } = 0;

        public int Blesseds { get; set; } = 0;

        public int Shares { get; set; } = 0;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
