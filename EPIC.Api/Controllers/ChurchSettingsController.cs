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
    public class ChurchSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChurchSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/ChurchSettings
        // Returns the current church settings
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<ChurchSettings>> GetSettings()
        {
            var settings = await _context.ChurchSettings
                .OrderByDescending(x => x.ChurchSettingsId)
                .FirstOrDefaultAsync();

            if (settings == null)
            {
                return NotFound(new
                {
                    message = "Church settings have not been configured yet."
                });
            }

            return Ok(settings);
        }


        // =========================================================
        // GET: api/ChurchSettings/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ChurchSettings>> GetSettingsById(
            int id)
        {
            var settings = await _context.ChurchSettings
                .FirstOrDefaultAsync(
                    x => x.ChurchSettingsId == id
                );

            if (settings == null)
            {
                return NotFound(new
                {
                    message = "Church settings not found."
                });
            }

            return Ok(settings);
        }


        // =========================================================
        // POST: api/ChurchSettings
        // Creates the first church settings record
        // =========================================================

        [HttpPost]
        public async Task<ActionResult<ChurchSettings>> CreateSettings(
            [FromBody] ChurchSettings settings)
        {
            if (settings == null)
            {
                return BadRequest(new
                {
                    message = "Church settings data is required."
                });
            }


            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(settings.ChurchName))
            {
                return BadRequest(new
                {
                    message = "Church name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(settings.ChurchCode))
            {
                return BadRequest(new
                {
                    message = "Church code is required."
                });
            }

            if (string.IsNullOrWhiteSpace(settings.Address))
            {
                return BadRequest(new
                {
                    message = "Church address is required."
                });
            }

            if (string.IsNullOrWhiteSpace(settings.PastorName))
            {
                return BadRequest(new
                {
                    message = "Pastor name is required."
                });
            }


            // -----------------------------------------------------
            // PREVENT DUPLICATE SETTINGS
            // -----------------------------------------------------

            var existingSettings =
                await _context.ChurchSettings
                    .FirstOrDefaultAsync();

            if (existingSettings != null)
            {
                return Conflict(new
                {
                    message =
                        "Church settings already exist. " +
                        "Use PUT to update them."
                });
            }


            // -----------------------------------------------------
            // CLEAN DATA
            // -----------------------------------------------------

            settings.ChurchName =
                settings.ChurchName.Trim();

            settings.ChurchCode =
                settings.ChurchCode
                    .Trim()
                    .ToUpper();

            settings.Address =
                settings.Address.Trim();

            settings.ContactNumber =
                settings.ContactNumber?.Trim() ?? "";

            settings.Email =
                settings.Email?.Trim() ?? "";

            settings.PastorName =
                settings.PastorName.Trim();

            settings.LogoPath =
                settings.LogoPath?.Trim() ?? "";

            settings.UpdatedDate =
                DateTime.Now;


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.ChurchSettings.Add(settings);

            await _context.SaveChangesAsync();


            return CreatedAtAction(
                nameof(GetSettingsById),
                new
                {
                    id = settings.ChurchSettingsId
                },
                settings
            );
        }


        // =========================================================
        // PUT: api/ChurchSettings/{id}
        // Updates existing church settings
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ChurchSettings>> UpdateSettings(
            int id,
            [FromBody] ChurchSettings updatedSettings)
        {
            if (updatedSettings == null)
            {
                return BadRequest(new
                {
                    message = "Church settings data is required."
                });
            }


            // -----------------------------------------------------
            // FIND EXISTING
            // -----------------------------------------------------

            var settings =
                await _context.ChurchSettings
                    .FirstOrDefaultAsync(
                        x => x.ChurchSettingsId == id
                    );

            if (settings == null)
            {
                return NotFound(new
                {
                    message = "Church settings not found."
                });
            }


            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                updatedSettings.ChurchName))
            {
                return BadRequest(new
                {
                    message = "Church name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                updatedSettings.ChurchCode))
            {
                return BadRequest(new
                {
                    message = "Church code is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                updatedSettings.Address))
            {
                return BadRequest(new
                {
                    message = "Church address is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                updatedSettings.PastorName))
            {
                return BadRequest(new
                {
                    message = "Pastor name is required."
                });
            }


            // -----------------------------------------------------
            // UPDATE ONLY SETTINGS FIELDS
            // -----------------------------------------------------

            settings.ChurchName =
                updatedSettings.ChurchName.Trim();

            settings.ChurchCode =
                updatedSettings.ChurchCode
                    .Trim()
                    .ToUpper();

            settings.Address =
                updatedSettings.Address.Trim();

            settings.ContactNumber =
                updatedSettings.ContactNumber?.Trim() ?? "";

            settings.Email =
                updatedSettings.Email?.Trim() ?? "";

            settings.PastorName =
                updatedSettings.PastorName.Trim();


            // -----------------------------------------------------
            // LOGO
            // -----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(
                updatedSettings.LogoPath))
            {
                settings.LogoPath =
                    updatedSettings.LogoPath.Trim();
            }


            // -----------------------------------------------------
            // UPDATED DATE
            // -----------------------------------------------------

            settings.UpdatedDate =
                DateTime.Now;


            await _context.SaveChangesAsync();


            return Ok(settings);
        }


        // =========================================================
        // DELETE: api/ChurchSettings/{id}
        // Optional administrative delete
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSettings(
            int id)
        {
            var settings =
                await _context.ChurchSettings
                    .FirstOrDefaultAsync(
                        x => x.ChurchSettingsId == id
                    );

            if (settings == null)
            {
                return NotFound(new
                {
                    message = "Church settings not found."
                });
            }


            _context.ChurchSettings.Remove(settings);

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Church settings deleted successfully."
            });
        }
    }
}