

using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionPlansController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionPlansController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ACTIVE PLANS
        // GET: api/SubscriptionPlans
        // PUBLIC
        // =========================================================

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<SubscriptionPlan>>> GetPlans()
        {
            var plans = await _context.SubscriptionPlans
                .AsNoTracking()
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.MonthlyPrice)
                .ToListAsync();

            return Ok(plans);
        }

        // =========================================================
        // GET PLAN BY ID
        // GET: api/SubscriptionPlans/5
        // PUBLIC
        // =========================================================

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<SubscriptionPlan>> GetPlan(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription plan ID."
                });
            }

            var plan = await _context.SubscriptionPlans
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.SubscriptionPlanId == id &&
                    p.IsActive);

            if (plan == null)
            {
                return NotFound(new
                {
                    message = "Subscription plan not found."
                });
            }

            return Ok(plan);
        }
        [HttpGet("admin")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<IEnumerable<SubscriptionPlan>>> GetAllPlansForAdmin()
        {
            var plans = await _context.SubscriptionPlans
                .AsNoTracking()
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.MonthlyPrice)
                .ToListAsync();

            return Ok(plans);
        }
        // =========================================================
        // CREATE PLAN
        // POST: api/SubscriptionPlans
        // AUTHENTICATED USERS
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<SubscriptionPlan>> CreatePlan(
            [FromBody] SubscriptionPlan plan)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            // -----------------------------------------------------
            // Normalize incoming values
            // -----------------------------------------------------

            plan.SubscriptionPlanId = 0;

            plan.PlanName = plan.PlanName.Trim();

            if (!string.IsNullOrWhiteSpace(plan.Description))
            {
                plan.Description = plan.Description.Trim();
            }

            if (plan.MonthlyPrice < 0 ||
                plan.AnnualPrice < 0)
            {
                return BadRequest(new
                {
                    message = "Subscription prices cannot be negative."
                });
            }

            if (plan.TrialDays < 0)
            {
                return BadRequest(new
                {
                    message = "Trial days cannot be negative."
                });
            }

            if (plan.MaxUsers < 0 ||
                plan.MaxMembers < 0)
            {
                return BadRequest(new
                {
                    message = "Subscription limits cannot be negative."
                });
            }

            // -----------------------------------------------------
            // Prevent duplicate plan names
            // -----------------------------------------------------

            var duplicateName =
                await _context.SubscriptionPlans
                    .AnyAsync(p =>
                        p.PlanName == plan.PlanName);

            if (duplicateName)
            {
                return Conflict(new
                {
                    message =
                        "A subscription plan with this name already exists."
                });
            }

            plan.CreatedDate = DateTime.Now;
            plan.UpdatedDate = null;

            _context.SubscriptionPlans.Add(plan);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPlan),
                new
                {
                    id = plan.SubscriptionPlanId
                },
                plan);
        }

        // =========================================================
        // UPDATE PLAN
        // PUT: api/SubscriptionPlans/5
        // AUTHENTICATED USERS
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdatePlan(
            int id,
            [FromBody] SubscriptionPlan updatedPlan)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription plan ID."
                });
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (id != updatedPlan.SubscriptionPlanId)
            {
                return BadRequest(new
                {
                    message =
                        "The route ID does not match the subscription plan ID."
                });
            }

            // -----------------------------------------------------
            // Validate numeric values
            // -----------------------------------------------------

            if (updatedPlan.MonthlyPrice < 0 ||
                updatedPlan.AnnualPrice < 0)
            {
                return BadRequest(new
                {
                    message = "Subscription prices cannot be negative."
                });
            }

            if (updatedPlan.TrialDays < 0)
            {
                return BadRequest(new
                {
                    message = "Trial days cannot be negative."
                });
            }

            if (updatedPlan.MaxUsers < 0 ||
                updatedPlan.MaxMembers < 0)
            {
                return BadRequest(new
                {
                    message = "Subscription limits cannot be negative."
                });
            }

            var existingPlan =
                await _context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.SubscriptionPlanId == id);

            if (existingPlan == null)
            {
                return NotFound(new
                {
                    message = "Subscription plan not found."
                });
            }

            var planName = updatedPlan.PlanName.Trim();

            // -----------------------------------------------------
            // Prevent duplicate plan names
            // -----------------------------------------------------

            var duplicateName =
                await _context.SubscriptionPlans
                    .AnyAsync(p =>
                        p.SubscriptionPlanId != id &&
                        p.PlanName == planName);

            if (duplicateName)
            {
                return Conflict(new
                {
                    message =
                        "Another subscription plan already uses this name."
                });
            }

            // -----------------------------------------------------
            // Update editable fields
            // -----------------------------------------------------

            existingPlan.PlanName = planName;

            existingPlan.Description =
                updatedPlan.Description?.Trim() ?? string.Empty;

            existingPlan.MonthlyPrice =
                updatedPlan.MonthlyPrice;

            existingPlan.AnnualPrice =
                updatedPlan.AnnualPrice;

            existingPlan.TrialDays =
                updatedPlan.TrialDays;

            existingPlan.MaxUsers =
                updatedPlan.MaxUsers;

            existingPlan.MaxMembers =
                updatedPlan.MaxMembers;

            existingPlan.IncludesChurchManagement =
                updatedPlan.IncludesChurchManagement;

            existingPlan.IncludesAttendance =
                updatedPlan.IncludesAttendance;

            existingPlan.IncludesGiving =
                updatedPlan.IncludesGiving;

            existingPlan.IncludesFinance =
                updatedPlan.IncludesFinance;

            existingPlan.IncludesMinistries =
                updatedPlan.IncludesMinistries;

            existingPlan.IncludesEPICLearning =
                updatedPlan.IncludesEPICLearning;

            existingPlan.IncludesReports =
                updatedPlan.IncludesReports;

            existingPlan.IsActive =
                updatedPlan.IsActive;

            existingPlan.SortOrder =
                updatedPlan.SortOrder;

            existingPlan.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(existingPlan);
        }

        // =========================================================
        // DELETE / DEACTIVATE PLAN
        // DELETE: api/SubscriptionPlans/5
        // AUTHENTICATED USERS
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription plan ID."
                });
            }

            var plan =
                await _context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.SubscriptionPlanId == id);

            if (plan == null)
            {
                return NotFound(new
                {
                    message = "Subscription plan not found."
                });
            }

            // -----------------------------------------------------
            // Check whether subscriptions already use this plan
            // -----------------------------------------------------

            var hasSubscriptions =
                await _context.Subscriptions
                    .AnyAsync(s =>
                        s.SubscriptionPlanId == id);

            if (hasSubscriptions)
            {
                // -------------------------------------------------
                // Soft delete
                // -------------------------------------------------

                plan.IsActive = false;
                plan.UpdatedDate = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Subscription plan has existing subscriptions and was deactivated instead of deleted."
                });
            }

            // -----------------------------------------------------
            // No subscriptions → physical delete is safe
            // -----------------------------------------------------

            _context.SubscriptionPlans.Remove(plan);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

