using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace EPIC.Api.Controllers
{

    [ApiController]
    [Route("api/admin/blog")]
    public class AdminBlogController : ControllerBase
    {

        private readonly ApplicationDbContext _context;


        public AdminBlogController(
            ApplicationDbContext context
        )
        {
            _context = context;
        }



        // ==========================================
        // CREATE BLOG
        // POST /api/admin/blog
        // ==========================================

        [HttpPost]
        public async Task<IActionResult> CreateBlog(
            BlogPost model
        )
        {


            model.CreatedDate =
                DateTime.UtcNow;



            if (model.IsPublished)
            {
                model.PublishDate =
                    DateTime.UtcNow;
            }



            _context.BlogPosts.Add(
                model
            );


            await _context.SaveChangesAsync();



            return Ok(model);

        }



        // ==========================================
        // ADMIN GET ALL BLOGS
        // GET /api/admin/blog
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> GetAllBlogs()
        {

            var blogs =
                await _context.BlogPosts

                .OrderByDescending(x =>
                    x.CreatedDate
                )

                .ToListAsync();



            return Ok(blogs);

        }


    }

}