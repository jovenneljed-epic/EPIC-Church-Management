using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/settings")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/settings/church
        // =========================================================

        [HttpGet("church")]
        public async Task<IActionResult> GetChurchSettings()
        {
            var settings =
                await _context.ChurchSettings
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

            // No settings record yet
            if (settings == null)
            {
                return Ok(new SettingsDto());
            }

            return Ok(new SettingsDto
            {
                ChurchName =
                    settings.ChurchName ?? "",

                ChurchCode =
                    settings.ChurchCode ?? "",

                Address =
                    settings.Address ?? "",

                ContactNumber =
                    settings.ContactNumber ?? "",

                Email =
                    settings.Email ?? "",

                PastorName =
                    settings.PastorName ?? "",

                LogoPath =
                    settings.LogoPath ?? ""
            });
        }


        // =========================================================
        // PUT: api/settings/church
        // =========================================================

        [HttpPut("church")]
        public async Task<IActionResult> UpdateChurchSettings(
            [FromBody] SettingsDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Settings data is required."
                });
            }

            // -----------------------------------------------------
            // FIND EXISTING SETTINGS
            // -----------------------------------------------------

            var settings =
                await _context.ChurchSettings
                    .FirstOrDefaultAsync();


            // =====================================================
            // CREATE
            // =====================================================

            if (settings == null)
            {
                settings = new ChurchSettings
                {
                    ChurchName =
                        request.ChurchName?.Trim() ?? "",

                    ChurchCode =
                        request.ChurchCode?.Trim().ToUpper() ?? "",

                    Address =
                        request.Address?.Trim() ?? "",

                    ContactNumber =
                        request.ContactNumber?.Trim() ?? "",

                    Email =
                        request.Email?.Trim() ?? "",

                    PastorName =
                        request.PastorName?.Trim() ?? "",

                    LogoPath =
                        request.LogoPath?.Trim() ?? "",

                    UpdatedDate =
                        DateTime.Now
                };

                _context.ChurchSettings.Add(settings);
            }

            // =====================================================
            // UPDATE
            // =====================================================

            else
            {
                settings.ChurchName =
                    request.ChurchName?.Trim() ?? "";

                settings.ChurchCode =
                    request.ChurchCode?.Trim().ToUpper() ?? "";

                settings.Address =
                    request.Address?.Trim() ?? "";

                settings.ContactNumber =
                    request.ContactNumber?.Trim() ?? "";

                settings.Email =
                    request.Email?.Trim() ?? "";

                settings.PastorName =
                    request.PastorName?.Trim() ?? "";

                settings.LogoPath =
                    request.LogoPath?.Trim() ?? "";

                settings.UpdatedDate =
                    DateTime.Now;
            }

            await _context.SaveChangesAsync();


            // =====================================================
            // RETURN
            // =====================================================

            return Ok(new
            {
                message =
                    "Church settings saved successfully.",

                settings = new SettingsDto
                {
                    ChurchName =
                        settings.ChurchName,

                    ChurchCode =
                        settings.ChurchCode,

                    Address =
                        settings.Address,

                    ContactNumber =
                        settings.ContactNumber,

                    Email =
                        settings.Email,

                    PastorName =
                        settings.PastorName,

                    LogoPath =
                        settings.LogoPath
                }
            });
        }
    }
}