using System;

namespace EPIC.Api.Models
{
    public class GalleryItem
    {
        public int Id { get; set; }

        public string Title { get; set; } = "";

        public string Description { get; set; } = "";

        public string ImageUrl { get; set; } = "";

        public string Category { get; set; } = "WORSHIP";

        public string EventLocation { get; set; } = "Main Sanctuary";

        public string CapturedBy { get; set; } = "EPIC Media Team";

        public string Badge { get; set; } = "MOMENT";

        public int Likes { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
