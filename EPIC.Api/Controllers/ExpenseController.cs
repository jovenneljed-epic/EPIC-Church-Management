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
            var expenses = await _context.Expenses
                .AsNoTracking()
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
            var expense = await _context.Expenses
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.ExpenseId == id);

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
                1
            );

            var nextMonth = monthStart.AddMonths(1);

            var totalExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            var todayExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow
                    )
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            var monthlyExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.ExpenseDate >= monthStart &&
                        e.ExpenseDate < nextMonth
                    )
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            var totalRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync();

            var todayRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow
                    );

            var monthlyRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync(e =>
                        e.ExpenseDate >= monthStart &&
                        e.ExpenseDate < nextMonth
                    );

            var categoryBreakdown =
                await _context.Expenses
                    .AsNoTracking()
                    .GroupBy(e => e.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(e => e.Amount),
                        records = g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();

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
                    message = "Expense amount must be greater than zero."
                });
            }

            if (expense.ExpenseDate == default)
            {
                expense.ExpenseDate = DateTime.Now;
            }

            expense.Category =
                expense.Category.Trim().ToUpperInvariant();

            expense.Description =
                expense.Description.Trim();

            expense.PaymentMethod =
                string.IsNullOrWhiteSpace(expense.PaymentMethod)
                    ? "CASH"
                    : expense.PaymentMethod.Trim().ToUpperInvariant();

            expense.ReferenceNumber =
                expense.ReferenceNumber?.Trim();

            expense.RecordedBy =
                string.IsNullOrWhiteSpace(expense.RecordedBy)
                    ? User.Identity?.Name ?? "SYSTEM"
                    : expense.RecordedBy.Trim();

            expense.RecordedDate = DateTime.Now;

            _context.Expenses.Add(expense);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetExpense),
                new
                {
                    id = expense.ExpenseId
                },
                expense
            );
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

            var expense =
                await _context.Expenses
                    .FirstOrDefaultAsync(
                        e => e.ExpenseId == id
                    );

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

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

            expense.Category =
                updatedExpense.Category
                    .Trim()
                    .ToUpperInvariant();

            expense.Description =
                updatedExpense.Description.Trim();

            expense.Amount =
                updatedExpense.Amount;

            expense.ExpenseDate =
                updatedExpense.ExpenseDate;

            expense.PaymentMethod =
                string.IsNullOrWhiteSpace(
                    updatedExpense.PaymentMethod)
                    ? "CASH"
                    : updatedExpense.PaymentMethod
                        .Trim()
                        .ToUpperInvariant();

            expense.ReferenceNumber =
                updatedExpense.ReferenceNumber?.Trim();

            await _context.SaveChangesAsync();

            return Ok(expense);
        }

        // ============================================================
        // DELETE: api/Expenses/{id}
        // ============================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var expense =
                await _context.Expenses
                    .FirstOrDefaultAsync(
                        e => e.ExpenseId == id
                    );

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            _context.Expenses.Remove(expense);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Expense deleted successfully."
            });
        }
    }
}