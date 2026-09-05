using EPIC.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace EPIC.Api.Controllers
{

    [ApiController]
    [Route("api/blog")]
    public class PublicBlogController : ControllerBase
    {

        private readonly ApplicationDbContext _context;


        public PublicBlogController(
            ApplicationDbContext context
        )
        {
            _context = context;
        }


        // ==========================================
        // GET ALL PUBLISHED BLOGS
        // GET /api/blog
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> GetBlogs()
        {

            var blogs =
                await _context.BlogPosts

                .AsNoTracking()

                .Where(x =>
                    x.IsPublished
                )

                .OrderByDescending(x =>
                    x.PublishDate
                )

                .Select(x => new
                {
                    x.BlogPostId,

                    x.Title,

                    x.Slug,

                    x.Category,

                    x.Excerpt,

                    x.Content,

                    x.CoverImage,

                    x.Author,

                    x.IsPublished,

                    x.CreatedDate,

                    x.PublishDate
                })

                .ToListAsync();


            return Ok(blogs);

        }



        // ==========================================
        // GET ONE BLOG BY SLUG
        // GET /api/blog/{slug}
        // ==========================================

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBlog(
            string slug
        )
        {

            var blog =
                await _context.BlogPosts

                .AsNoTracking()

                .Where(x =>
                    x.IsPublished &&
                    x.Slug == slug
                )

                .Select(x => new
                {
                    x.BlogPostId,

                    x.Title,

                    x.Slug,

                    x.Category,

                    x.Excerpt,

                    x.Content,

                    x.CoverImage,

                    x.Author,

                    x.IsPublished,

                    x.CreatedDate,

                    x.PublishDate
                })

                .FirstOrDefaultAsync();


            if (blog == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Blog article not found."
                    }
                );
            }


            return Ok(blog);

        }

    }

}