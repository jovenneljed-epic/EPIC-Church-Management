using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MinistryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MinistryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL MINISTRIES
        // GET: api/Ministry
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetMinistries()
        {
            var ministries = await _context.Ministries
                .AsNoTracking()
                .OrderBy(m => m.Name)
                .ToListAsync();

            return Ok(ministries);
        }

        // =========================================================
        // GET MINISTRY BY ID
        // GET: api/Ministry/5
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetMinistry(int id)
        {
            var ministry = await _context.Ministries
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.MinistryId == id);

            if (ministry == null)
            {
                return NotFound("MINISTRY NOT FOUND.");
            }

            return Ok(ministry);
        }

        // =========================================================
        // SEARCH MINISTRY
        // GET: api/Ministry/search?name=worship
        // =========================================================

        [HttpGet("search")]
        public async Task<IActionResult> SearchMinistries(
            [FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(
                    "PLEASE ENTER A MINISTRY NAME TO SEARCH.");
            }

            string keyword = name.Trim();

            var ministries = await _context.Ministries
                .AsNoTracking()
                .Where(m =>
                    EF.Functions.Like(
                        m.Name,
                        $"%{keyword}%")

                    || EF.Functions.Like(
                        m.MinistryCode,
                        $"%{keyword}%")

                    || EF.Functions.Like(
                        m.MinistryHead,
                        $"%{keyword}%"))
                .OrderBy(m => m.Name)
                .ToListAsync();

            return Ok(ministries);
        }

        // =========================================================
        // CREATE MINISTRY
        // POST: api/Ministry
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateMinistry(
            [FromBody] Ministry ministry)
        {
            // -----------------------------------------------------
            // VALIDATE NAME
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(ministry.Name))
            {
                return BadRequest(
                    "MINISTRY NAME IS REQUIRED.");
            }

            // -----------------------------------------------------
            // CLEAN ALL TEXT FIELDS
            // -----------------------------------------------------

            ministry.Name =
                ministry.Name.Trim();

            ministry.MinistryCode =
                ministry.MinistryCode?.Trim().ToUpper() ?? "";

            ministry.MinistryHead =
                ministry.MinistryHead?.Trim() ?? "";

            ministry.ContactNumber =
                ministry.ContactNumber?.Trim() ?? "";

            ministry.Description =
                ministry.Description?.Trim() ?? "";

            ministry.MeetingDay =
                ministry.MeetingDay?.Trim() ?? "";

            ministry.MeetingTime =
                ministry.MeetingTime?.Trim() ?? "";

            ministry.MeetingLocation =
                ministry.MeetingLocation?.Trim() ?? "";

            // -----------------------------------------------------
            // GENERATE CODE IF EMPTY
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                ministry.MinistryCode))
            {
                ministry.MinistryCode =
                    await GenerateMinistryCode();
            }
            else
            {
                bool codeExists =
                    await _context.Ministries
                        .AnyAsync(m =>
                            m.MinistryCode ==
                            ministry.MinistryCode);

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MINISTRY CODE ALREADY EXISTS.",

                        ministryCode =
                            ministry.MinistryCode
                    });
                }
            }

            // -----------------------------------------------------
            // STATUS
            // -----------------------------------------------------

            ministry.Status =
                string.IsNullOrWhiteSpace(
                    ministry.Status)

                ? "ACTIVE"

                : ministry.Status
                    .Trim()
                    .ToUpper();

            // -----------------------------------------------------
            // DATES
            // -----------------------------------------------------

            ministry.CreatedDate =
                DateTime.Now;

            ministry.UpdatedDate = null;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.Ministries.Add(ministry);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return CreatedAtAction(
                nameof(GetMinistry),

                new
                {
                    id = ministry.MinistryId
                },

                new
                {
                    message =
                        "MINISTRY CREATED SUCCESSFULLY.",

                    ministryId =
                        ministry.MinistryId,

                    ministryCode =
                        ministry.MinistryCode,

                    name =
                        ministry.Name,

                    ministryHead =
                        ministry.MinistryHead,

                    contactNumber =
                        ministry.ContactNumber,

                    description =
                        ministry.Description,

                    meetingDay =
                        ministry.MeetingDay,

                    meetingTime =
                        ministry.MeetingTime,

                    meetingLocation =
                        ministry.MeetingLocation,

                    status =
                        ministry.Status,

                    createdDate =
                        ministry.CreatedDate
                });
        }

        // =========================================================
        // UPDATE MINISTRY
        // PUT: api/Ministry/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateMinistry(
            int id,
            [FromBody] Ministry updatedMinistry)
        {
            var ministry =
                await _context.Ministries
                    .FirstOrDefaultAsync(
                        m => m.MinistryId == id);

            if (ministry == null)
            {
                return NotFound(
                    "MINISTRY NOT FOUND.");
            }

            // -----------------------------------------------------
            // VALIDATE NAME
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                updatedMinistry.Name))
            {
                return BadRequest(
                    "MINISTRY NAME IS REQUIRED.");
            }

            // -----------------------------------------------------
            // UPDATE BASIC INFORMATION
            // -----------------------------------------------------

            ministry.Name =
                updatedMinistry.Name.Trim();

            ministry.MinistryHead =
                updatedMinistry.MinistryHead?
                    .Trim() ?? "";

            ministry.ContactNumber =
                updatedMinistry.ContactNumber?
                    .Trim() ?? "";

            ministry.Description =
                updatedMinistry.Description?
                    .Trim() ?? "";

            // -----------------------------------------------------
            // UPDATE MEETING INFORMATION
            // -----------------------------------------------------

            ministry.MeetingDay =
                updatedMinistry.MeetingDay?
                    .Trim() ?? "";

            ministry.MeetingTime =
                updatedMinistry.MeetingTime?
                    .Trim() ?? "";

            ministry.MeetingLocation =
                updatedMinistry.MeetingLocation?
                    .Trim() ?? "";

            // -----------------------------------------------------
            // STATUS
            // -----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(
                updatedMinistry.Status))
            {
                ministry.Status =
                    updatedMinistry.Status
                        .Trim()
                        .ToUpper();
            }

            // -----------------------------------------------------
            // KEEP EXISTING CODE
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                ministry.MinistryCode))
            {
                ministry.MinistryCode =
                    await GenerateMinistryCode();
            }

            // -----------------------------------------------------
            // DATE
            // -----------------------------------------------------

            ministry.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY UPDATED SUCCESSFULLY.",

                ministryId =
                    ministry.MinistryId,

                ministryCode =
                    ministry.MinistryCode,

                name =
                    ministry.Name,

                ministryHead =
                    ministry.MinistryHead,

                contactNumber =
                    ministry.ContactNumber,

                description =
                    ministry.Description,

                meetingDay =
                    ministry.MeetingDay,

                meetingTime =
                    ministry.MeetingTime,

                meetingLocation =
                    ministry.MeetingLocation,

                status =
                    ministry.Status,

                updatedDate =
                    ministry.UpdatedDate
            });
        }

        // =========================================================
        // ACTIVATE MINISTRY
        // PUT: api/Ministry/5/activate
        // =========================================================

        [HttpPut("{id:int}/activate")]
        public async Task<IActionResult> ActivateMinistry(
            int id)
        {
            var ministry =
                await _context.Ministries
                    .FirstOrDefaultAsync(
                        m => m.MinistryId == id);

            if (ministry == null)
            {
                return NotFound(
                    "MINISTRY NOT FOUND.");
            }

            ministry.Status = "ACTIVE";
            ministry.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY ACTIVATED SUCCESSFULLY.",

                ministryId =
                    ministry.MinistryId,

                status =
                    ministry.Status
            });
        }

        // =========================================================
        // DEACTIVATE MINISTRY
        // DELETE: api/Ministry/5
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeactivateMinistry(int id)
        {
            var ministry =
                await _context.Ministries
                    .FirstOrDefaultAsync(
                        m => m.MinistryId == id);

            if (ministry == null)
            {
                return NotFound(
                    "MINISTRY NOT FOUND.");
            }

            // Soft delete
            ministry.Status = "INACTIVE";
            ministry.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MINISTRY DEACTIVATED SUCCESSFULLY.",

                ministryId =
                    ministry.MinistryId,

                ministryCode =
                    ministry.MinistryCode,

                status =
                    ministry.Status
            });
        }

        // =========================================================
        // GET ACTIVE MINISTRIES
        // GET: api/Ministry/active
        // =========================================================

        [HttpGet("active")]
        public async Task<IActionResult>
            GetActiveMinistries()
        {
            var ministries =
                await _context.Ministries
                    .AsNoTracking()
                    .Where(m =>
                        m.Status == "ACTIVE")
                    .OrderBy(m =>
                        m.Name)
                    .ToListAsync();

            return Ok(ministries);
        }

        // =========================================================
        // MINISTRY SUMMARY
        // GET: api/Ministry/summary
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult>
            GetMinistrySummary()
        {
            var ministries =
                await _context.Ministries
                    .AsNoTracking()
                    .ToListAsync();

            int total =
                ministries.Count;

            int active =
                ministries.Count(
                    m => m.Status == "ACTIVE");

            int inactive =
                ministries.Count(
                    m => m.Status == "INACTIVE");

            return Ok(new
            {
                totalMinistries =
                    total,

                activeMinistries =
                    active,

                inactiveMinistries =
                    inactive
            });
        }

        // =========================================================
        // GENERATE MINISTRY CODE
        // =========================================================

        private async Task<string>
            GenerateMinistryCode()
        {
            int nextNumber = 1;

            var lastMinistry =
                await _context.Ministries
                    .OrderByDescending(
                        m => m.MinistryId)
                    .FirstOrDefaultAsync();

            if (lastMinistry != null)
            {
                nextNumber =
                    lastMinistry.MinistryId + 1;
            }

            string code =
                $"MIN-{nextNumber:0000}";

            // -----------------------------------------------------
            // EXTRA SAFETY
            // -----------------------------------------------------

            while (await _context.Ministries
                .AnyAsync(m =>
                    m.MinistryCode == code))
            {
                nextNumber++;

                code =
                    $"MIN-{nextNumber:0000}";
            }

            return code;
        }
    }
}