
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
    public class ExpensesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExpensesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET: api/Expenses
        // ============================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses()
        {
            var query = _context.Expenses
                .AsNoTracking()
                .AsQueryable();

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message = "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                query = query.Where(e =>
                    e.CustomerId == customerId.Value);
            }

            var expenses = await query
                .OrderByDescending(e => e.ExpenseDate)
                .ThenByDescending(e => e.ExpenseId)
                .ToListAsync();

            return Ok(expenses);
        }

        // ============================================================
        // GET: api/Expenses/{id}
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Expense>> GetExpense(int id)
        {
            var query = _context.Expenses
                .AsNoTracking()
                .AsQueryable();

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message = "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                query = query.Where(e =>
                    e.CustomerId == customerId.Value);
            }

            var expense = await query
                .FirstOrDefaultAsync(e =>
                    e.ExpenseId == id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            return Ok(expense);
        }

        // ============================================================
        // GET: api/Expenses/dashboard
        // ============================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var monthStart = new DateTime(
                today.Year,
                today.Month,
                1);

            var nextMonth = monthStart.AddMonths(1);

            var query = _context.Expenses
                .AsNoTracking()
                .AsQueryable();

            // =========================================================
            // CLIENT TENANT FILTER
            // =========================================================

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                query = query.Where(e =>
                    e.CustomerId == customerId.Value);
            }

            // =========================================================
            // TOTAL EXPENSES
            // =========================================================

            var totalExpenses =
                await query
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // =========================================================
            // TODAY'S EXPENSES
            // =========================================================

            var todayExpenses =
                await query
                    .Where(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // =========================================================
            // MONTHLY EXPENSES
            // =========================================================

            var monthlyExpenses =
                await query
                    .Where(e =>
                        e.ExpenseDate >= monthStart &&
                        e.ExpenseDate < nextMonth)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // =========================================================
            // RECORD COUNTS
            // =========================================================

            var totalRecords =
                await query.CountAsync();

            var todayRecords =
                await query
                    .CountAsync(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow);

            var monthlyRecords =
                await query
                    .CountAsync(e =>
                        e.ExpenseDate >= monthStart &&
                        e.ExpenseDate < nextMonth);

            // =========================================================
            // CATEGORY BREAKDOWN
            // =========================================================

            var categoryBreakdown =
                await query
                    .GroupBy(e => e.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(e => e.Amount),
                        records = g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();

            // =========================================================
            // RESPONSE
            // =========================================================

            return Ok(new
            {
                totalExpenses,
                todayExpenses,
                monthlyExpenses,

                totalRecords,
                todayRecords,
                monthlyRecords,

                categoryBreakdown
            });
        }

        // ============================================================
        // POST: api/Expenses
        // ============================================================

        [HttpPost]
        public async Task<ActionResult<Expense>> CreateExpense(
            [FromBody] Expense expense)
        {
            if (expense == null)
            {
                return BadRequest(new
                {
                    message = "Expense data is required."
                });
            }

            // =========================================================
            // VALIDATION
            // =========================================================

            if (string.IsNullOrWhiteSpace(expense.Category))
            {
                return BadRequest(new
                {
                    message = "Expense category is required."
                });
            }

            if (string.IsNullOrWhiteSpace(expense.Description))
            {
                return BadRequest(new
                {
                    message = "Expense description is required."
                });
            }

            if (expense.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Expense amount must be greater than zero."
                });
            }

            // =========================================================
            // CUSTOMER ID
            // =========================================================

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                // NEVER TRUST CUSTOMER ID FROM THE FRONTEND.
                // Always use the authenticated client's customer.
                expense.CustomerId = customerId.Value;
            }
            else
            {
                // ADMIN behavior.
                //
                // If CustomerId was supplied, preserve it.
                // If not supplied, use CustomerId 1 for the
                // current single-church installation.

                if (expense.CustomerId <= 0)
                {
                    expense.CustomerId = 1;
                }
            }

            // =========================================================
            // VERIFY CUSTOMER EXISTS
            // =========================================================

            var customerExists =
                await _context.Customers
                    .AsNoTracking()
                    .AnyAsync(c =>
                        c.CustomerId ==
                        expense.CustomerId);

            if (!customerExists)
            {
                return BadRequest(new
                {
                    message = "CUSTOMER NOT FOUND."
                });
            }

            // =========================================================
            // DEFAULTS / NORMALIZATION
            // =========================================================

            if (expense.ExpenseDate == default)
            {
                expense.ExpenseDate = DateTime.Now;
            }

            expense.Category =
                expense.Category
                    .Trim()
                    .ToUpperInvariant();

            expense.Description =
                expense.Description.Trim();

            expense.PaymentMethod =
                string.IsNullOrWhiteSpace(
                    expense.PaymentMethod)
                    ? "CASH"
                    : expense.PaymentMethod
                        .Trim()
                        .ToUpperInvariant();

            expense.ReferenceNumber =
                expense.ReferenceNumber?.Trim();

            expense.RecordedBy =
                string.IsNullOrWhiteSpace(
                    expense.RecordedBy)
                    ? User.Identity?.Name ?? "SYSTEM"
                    : expense.RecordedBy.Trim();

            expense.RecordedDate =
                DateTime.Now;

            // =========================================================
            // SAVE
            // =========================================================

            _context.Expenses.Add(expense);

            await _context.SaveChangesAsync();

            // =========================================================
            // RESPONSE
            // =========================================================

            return CreatedAtAction(
                nameof(GetExpense),
                new
                {
                    id = expense.ExpenseId
                },
                expense);
        }

        // ============================================================
        // PUT: api/Expenses/{id}
        // ============================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateExpense(
            int id,
            [FromBody] Expense updatedExpense)
        {
            if (updatedExpense == null)
            {
                return BadRequest(new
                {
                    message = "Expense data is required."
                });
            }

            // =========================================================
            // VALIDATION
            // =========================================================

            if (string.IsNullOrWhiteSpace(
                updatedExpense.Category))
            {
                return BadRequest(new
                {
                    message = "Expense category is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                updatedExpense.Description))
            {
                return BadRequest(new
                {
                    message = "Expense description is required."
                });
            }

            if (updatedExpense.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Expense amount must be greater than zero."
                });
            }

            // =========================================================
            // LOAD EXPENSE
            // =========================================================

            var query = _context.Expenses
                .AsQueryable();

            // =========================================================
            // CLIENT TENANT FILTER
            // =========================================================

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                query = query.Where(e =>
                    e.CustomerId == customerId.Value);
            }

            // =========================================================
            // FIND EXPENSE
            // =========================================================

            var expense =
                await query
                    .FirstOrDefaultAsync(e =>
                        e.ExpenseId == id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            // =========================================================
            // UPDATE
            // =========================================================

            expense.Category =
                updatedExpense.Category
                    .Trim()
                    .ToUpperInvariant();

            expense.Description =
                updatedExpense.Description.Trim();

            expense.Amount =
                updatedExpense.Amount;

            if (updatedExpense.ExpenseDate != default)
            {
                expense.ExpenseDate =
                    updatedExpense.ExpenseDate;
            }

            expense.PaymentMethod =
                string.IsNullOrWhiteSpace(
                    updatedExpense.PaymentMethod)
                    ? "CASH"
                    : updatedExpense.PaymentMethod
                        .Trim()
                        .ToUpperInvariant();

            expense.ReferenceNumber =
                updatedExpense.ReferenceNumber?.Trim();

            // =========================================================
            // IMPORTANT
            //
            // CustomerId is NEVER changed during an update.
            // This prevents an expense from being transferred
            // between customers through the API.
            // =========================================================

            await _context.SaveChangesAsync();

            return Ok(expense);
        }

        // ============================================================
        // DELETE: api/Expenses/{id}
        // ============================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            // =========================================================
            // LOAD EXPENSE QUERY
            // =========================================================

            var query = _context.Expenses
                .AsQueryable();

            // =========================================================
            // CLIENT TENANT FILTER
            // =========================================================

            if (IsClientAccount())
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                    });
                }

                query = query.Where(e =>
                    e.CustomerId == customerId.Value);
            }

            // =========================================================
            // FIND EXPENSE
            // =========================================================

            var expense =
                await query
                    .FirstOrDefaultAsync(e =>
                        e.ExpenseId == id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            // =========================================================
            // DELETE
            // =========================================================

            _context.Expenses.Remove(expense);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Expense deleted successfully."
            });
        }

        // ============================================================
        // GET CUSTOMER ID FROM JWT
        // ============================================================

        private int? GetCustomerId()
        {
            // =========================================================
            // PRIMARY CLAIM
            // =========================================================

            var claim =
                User.FindFirst("customerId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out var customerId))
            {
                return customerId;
            }

            // =========================================================
            // COMPATIBILITY CLAIM
            // =========================================================

            claim =
                User.FindFirst("CustomerId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out customerId))
            {
                return customerId;
            }

            // =========================================================
            // TENANT CLAIM
            // =========================================================

            claim =
                User.FindFirst("tenantId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out customerId))
            {
                return customerId;
            }

            return null;
        }

        // ============================================================
        // CHECK CLIENT ACCOUNT
        // ============================================================

        private bool IsClientAccount()
        {
            // ASP.NET Core role claim
            if (User.IsInRole("CLIENT"))
            {
                return true;
            }

            // Explicit role claim compatibility
            var roleClaim =
                User.FindFirst("role")?.Value;

            return string.Equals(
                roleClaim?.Trim(),
                "CLIENT",
                StringComparison.OrdinalIgnoreCase);
        }
    }
}

