namespace EPIC.Api.Models
{

    public class BlogPost
    {

        public int BlogPostId { get; set; }


        public string Title { get; set; } = "";



        public string Slug { get; set; } = "";



        public string Category { get; set; } = "";



        public string Excerpt { get; set; } = "";



        public string Content { get; set; } = "";



        public string? CoverImage { get; set; }



        public string Author { get; set; } = "";



        public bool IsPublished { get; set; }



        public DateTime CreatedDate { get; set; }
            = DateTime.UtcNow;



        public DateTime? PublishDate { get; set; }

    }

}