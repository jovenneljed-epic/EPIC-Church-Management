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
    public class ChurchServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChurchServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/ChurchServices
        // GET ALL CHURCH SERVICES
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetServices()
        {
            try
            {
                var services = await _context.ChurchServices
                    .AsNoTracking()
                    .OrderByDescending(s => s.ServiceDate)
                    .ThenBy(s => s.StartTime)
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load church services.",
                    error = ex.Message
                });
            }
        }


        // =========================================================
        // GET: api/ChurchServices/5
        // GET SINGLE SERVICE
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetService(int id)
        {
            try
            {
                var service = await _context.ChurchServices
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s =>
                        s.ChurchServiceId == id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load church service.",
                    error = ex.Message
                });
            }
        }


        // =========================================================
        // GET: api/ChurchServices/upcoming
        // UPCOMING SERVICES
        // =========================================================

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingServices()
        {
            try
            {
                var today = DateTime.Today;

                var services = await _context.ChurchServices
                    .AsNoTracking()
                    .Where(s =>
                        s.ServiceDate >= today &&
                        s.Status != "CANCELLED")
                    .OrderBy(s => s.ServiceDate)
                    .ThenBy(s => s.StartTime)
                    .Take(10)
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load upcoming church services.",
                    error = ex.Message
                });
            }
        }


        // =========================================================
        // GET: api/ChurchServices/recent
        // RECENT SERVICES
        // =========================================================

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentServices()
        {
            try
            {
                var today = DateTime.Today;

                var services = await _context.ChurchServices
                    .AsNoTracking()
                    .Where(s =>
                        s.ServiceDate < today)
                    .OrderByDescending(s => s.ServiceDate)
                    .ThenByDescending(s => s.StartTime)
                    .Take(10)
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load recent church services.",
                    error = ex.Message
                });
            }
        }


        // =========================================================
        // POST: api/ChurchServices
        // CREATE SERVICE
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateService(
            [FromBody] ChurchService service)
        {
            try
            {
                if (service == null)
                {
                    return BadRequest(new
                    {
                        message = "Invalid church service data."
                    });
                }

                if (string.IsNullOrWhiteSpace(service.ServiceName))
                {
                    return BadRequest(new
                    {
                        message = "Service name is required."
                    });
                }

                if (service.ServiceDate == default)
                {
                    return BadRequest(new
                    {
                        message = "Service date is required."
                    });
                }

                // -------------------------------------------------
                // DEFAULT VALUES
                // -------------------------------------------------

                if (string.IsNullOrWhiteSpace(service.Status))
                {
                    service.Status = "SCHEDULED";
                }

                service.CreatedDate = DateTime.Now;
                service.UpdatedDate = null;

                // -------------------------------------------------
                // CLEAN INPUT
                // -------------------------------------------------

                service.ServiceName =
                    service.ServiceName.Trim();

                service.ServiceType =
                    service.ServiceType?.Trim() ?? "";

                service.StartTime =
                    service.StartTime?.Trim() ?? "";

                service.EndTime =
                    service.EndTime?.Trim() ?? "";

                service.Location =
                    service.Location?.Trim() ?? "";

                service.ServiceLeader =
                    service.ServiceLeader?.Trim() ?? "";

                service.Speaker =
                    service.Speaker?.Trim() ?? "";

                service.Description =
                    service.Description?.Trim() ?? "";

                service.Status =
                    service.Status.Trim().ToUpper();

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                _context.ChurchServices.Add(service);

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetService),
                    new
                    {
                        id = service.ChurchServiceId
                    },
                    service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to create church service.",
                    error = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }


        // =========================================================
        // PUT: api/ChurchServices/5
        // UPDATE SERVICE
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateService(
            int id,
            [FromBody] ChurchService updatedService)
        {
            try
            {
                if (updatedService == null)
                {
                    return BadRequest(new
                    {
                        message = "Invalid church service data."
                    });
                }

                var service =
                    await _context.ChurchServices
                        .FirstOrDefaultAsync(s =>
                            s.ChurchServiceId == id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                    updatedService.ServiceName))
                {
                    return BadRequest(new
                    {
                        message = "Service name is required."
                    });
                }

                if (updatedService.ServiceDate == default)
                {
                    return BadRequest(new
                    {
                        message = "Service date is required."
                    });
                }

                // -------------------------------------------------
                // UPDATE
                // -------------------------------------------------

                service.ServiceName =
                    updatedService.ServiceName.Trim();

                service.ServiceType =
                    updatedService.ServiceType?.Trim() ?? "";

                service.ServiceDate =
                    updatedService.ServiceDate;

                service.StartTime =
                    updatedService.StartTime?.Trim() ?? "";

                service.EndTime =
                    updatedService.EndTime?.Trim() ?? "";

                service.Location =
                    updatedService.Location?.Trim() ?? "";

                service.ServiceLeader =
                    updatedService.ServiceLeader?.Trim() ?? "";

                service.Speaker =
                    updatedService.Speaker?.Trim() ?? "";

                service.Description =
                    updatedService.Description?.Trim() ?? "";

                service.Status =
                    string.IsNullOrWhiteSpace(
                        updatedService.Status)
                        ? "SCHEDULED"
                        : updatedService.Status
                            .Trim()
                            .ToUpper();

                service.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to update church service.",
                    error = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }


        // =========================================================
        // PATCH: api/ChurchServices/5/status
        // UPDATE STATUS ONLY
        // =========================================================

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] StatusRequest request)
        {
            try
            {
                var service =
                    await _context.ChurchServices
                        .FirstOrDefaultAsync(s =>
                            s.ChurchServiceId == id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.Status))
                {
                    return BadRequest(new
                    {
                        message = "Status is required."
                    });
                }

                service.Status =
                    request.Status
                        .Trim()
                        .ToUpper();

                service.UpdatedDate =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to update service status.",
                    error = ex.Message
                });
            }
        }


        // =========================================================
        // DELETE: api/ChurchServices/5
        // DELETE SERVICE
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            try
            {
                var service =
                    await _context.ChurchServices
                        .FirstOrDefaultAsync(s =>
                            s.ChurchServiceId == id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                _context.ChurchServices.Remove(service);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Church service deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to delete church service.",
                    error = ex.Message
                });
            }
        }
    }


    // =============================================================
    // STATUS REQUEST
    // =============================================================

    public class StatusRequest
    {
        public string Status { get; set; } = "";
    }
}