using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    public class IncomeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IncomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL INCOME
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetIncome()
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var income = await _context.Incomes
                .AsNoTracking()
                .Where(i => i.CustomerId == customerId)
                .OrderByDescending(i => i.IncomeDate)
                .ThenByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }

        // =========================================================
        // GET INCOME BY ID
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIncomeById(int id)
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var income = await _context.Incomes
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IncomeId == id && i.CustomerId == customerId);

            if (income == null)
            {
                return NotFound(new
                {
                    message = "INCOME RECORD NOT FOUND."
                });
            }

            return Ok(income);
        }

        // =========================================================
        // GET INCOME BY DATE
        // =========================================================

        [HttpGet("date")]
        public async Task<IActionResult> GetIncomeByDate(
            [FromQuery] DateTime date)
        {
            var customerId = GetCurrentCustomerId() ?? 1;
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var income = await _context.Incomes
                .AsNoTracking()
                .Where(i =>
                    i.CustomerId == customerId &&
                    i.IncomeDate >= startDate &&
                    i.IncomeDate < endDate)
                .OrderByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }

        // =========================================================
        // GET INCOME BY CATEGORY
        // =========================================================

        [HttpGet("category")]
        public async Task<IActionResult> GetIncomeByCategory(
            [FromQuery] string category)
        {
            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest(new
                {
                    message = "CATEGORY IS REQUIRED."
                });
            }

            var categoryName = category.Trim().ToUpper();
            var customerId = GetCurrentCustomerId() ?? 1;

            var income = await _context.Incomes
                .AsNoTracking()
                .Where(i =>
                    i.CustomerId == customerId &&
                    i.Category == categoryName)
                .OrderByDescending(i => i.IncomeDate)
                .ThenByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }

        // =========================================================
        // FINANCIAL DASHBOARD
        // =========================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetIncomeDashboard()
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var firstDayOfMonth =
                new DateTime(
                    today.Year,
                    today.Month,
                    1);

            var firstDayOfNextMonth =
                firstDayOfMonth.AddMonths(1);

            // TOTAL INCOME
            var totalIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;

            // TODAY'S INCOME
            var todayIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.CustomerId == customerId &&
                        i.IncomeDate >= today &&
                        i.IncomeDate < tomorrow)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;

            // MONTHLY INCOME
            var monthlyIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.CustomerId == customerId &&
                        i.IncomeDate >= firstDayOfMonth &&
                        i.IncomeDate < firstDayOfNextMonth)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;

            // RECORD COUNTS
            var totalIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .CountAsync();

            var todayIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.CustomerId == customerId &&
                        i.IncomeDate >= today &&
                        i.IncomeDate < tomorrow)
                    .CountAsync();

            var monthlyIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.CustomerId == customerId &&
                        i.IncomeDate >= firstDayOfMonth &&
                        i.IncomeDate < firstDayOfNextMonth)
                    .CountAsync();

            // TOTAL EXPENSES
            var totalExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e => e.CustomerId == customerId)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // TODAY'S EXPENSES
            var todayExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId &&
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // MONTHLY EXPENSES
            var monthlyExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId &&
                        e.ExpenseDate >= firstDayOfMonth &&
                        e.ExpenseDate < firstDayOfNextMonth)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;

            // EXPENSE RECORD COUNTS
            var totalExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e => e.CustomerId == customerId)
                    .CountAsync();

            var todayExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId &&
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow)
                    .CountAsync();

            var monthlyExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId &&
                        e.ExpenseDate >= firstDayOfMonth &&
                        e.ExpenseDate < firstDayOfNextMonth)
                    .CountAsync();

            var netChurchFunds =
                totalIncome - totalExpenses;

            var todayNetFunds =
                todayIncome - todayExpenses;

            var monthlyNetFunds =
                monthlyIncome - monthlyExpenses;

            var incomeCategoryBreakdown =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(i => i.Amount),
                        records = g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();

            var expenseCategoryBreakdown =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e => e.CustomerId == customerId)
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
                totalIncome,
                todayIncome,
                monthlyIncome,
                totalRecords = totalIncomeRecords,
                todayRecords = todayIncomeRecords,
                monthlyRecords = monthlyIncomeRecords,

                totalExpenses,
                todayExpenses,
                monthlyExpenses,
                totalExpenseRecords,
                todayExpenseRecords,
                monthlyExpenseRecords,

                netChurchFunds,
                todayNetFunds,
                monthlyNetFunds,

                incomeCategoryBreakdown,
                expenseCategoryBreakdown,

                financialPosition = new
                {
                    totalIncome,
                    totalExpenses,
                    netChurchFunds
                }
            });
        }

        // =========================================================
        // RECORD INCOME
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateIncome(
            [FromBody] Income income)
        {
            if (income == null)
            {
                return BadRequest(new
                {
                    message = "INCOME INFORMATION IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(income.Category))
            {
                return BadRequest(new
                {
                    message = "CATEGORY IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(income.Description))
            {
                return BadRequest(new
                {
                    message = "DESCRIPTION IS REQUIRED."
                });
            }

            if (income.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "AMOUNT MUST BE GREATER THAN ZERO."
                });
            }

            var customerId = GetCurrentCustomerId() ?? (income.CustomerId > 0 ? income.CustomerId : 1);
            income.CustomerId = customerId;

            income.Category = income.Category.Trim().ToUpper();
            income.Description = income.Description.Trim();

            if (income.IncomeDate == default)
            {
                income.IncomeDate = DateTime.Today;
            }

            income.PaymentMethod = income.PaymentMethod?.Trim().ToUpper() ?? "";
            income.ReferenceNumber = income.ReferenceNumber?.Trim() ?? "";
            income.RecordedBy = User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";
            income.RecordedDate = DateTime.Now;

            _context.Incomes.Add(income);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetIncomeById),
                new
                {
                    id = income.IncomeId
                },
                new
                {
                    message = "INCOME RECORDED SUCCESSFULLY.",
                    incomeId = income.IncomeId,
                    category = income.Category,
                    description = income.Description,
                    amount = income.Amount,
                    incomeDate = income.IncomeDate,
                    paymentMethod = income.PaymentMethod,
                    referenceNumber = income.ReferenceNumber,
                    recordedBy = income.RecordedBy,
                    recordedDate = income.RecordedDate
                });
        }

        // =========================================================
        // UPDATE INCOME
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateIncome(
            int id,
            [FromBody] Income updatedIncome)
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var income =
                await _context.Incomes
                    .FirstOrDefaultAsync(
                        i => i.IncomeId == id && i.CustomerId == customerId);

            if (income == null)
            {
                return NotFound(new
                {
                    message = "INCOME RECORD NOT FOUND."
                });
            }

            if (updatedIncome == null)
            {
                return BadRequest(new
                {
                    message = "INCOME INFORMATION IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(updatedIncome.Category))
            {
                return BadRequest(new
                {
                    message = "CATEGORY IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(updatedIncome.Description))
            {
                return BadRequest(new
                {
                    message = "DESCRIPTION IS REQUIRED."
                });
            }

            if (updatedIncome.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "AMOUNT MUST BE GREATER THAN ZERO."
                });
            }

            income.Category = updatedIncome.Category.Trim().ToUpper();
            income.Description = updatedIncome.Description.Trim();
            income.Amount = updatedIncome.Amount;

            if (updatedIncome.IncomeDate != default)
            {
                income.IncomeDate = updatedIncome.IncomeDate;
            }

            income.PaymentMethod = updatedIncome.PaymentMethod?.Trim().ToUpper() ?? "";
            income.ReferenceNumber = updatedIncome.ReferenceNumber?.Trim() ?? "";
            income.RecordedBy = User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? income.RecordedBy;
            income.RecordedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "INCOME UPDATED SUCCESSFULLY.",
                incomeId = income.IncomeId,
                category = income.Category,
                description = income.Description,
                amount = income.Amount,
                incomeDate = income.IncomeDate,
                paymentMethod = income.PaymentMethod,
                referenceNumber = income.ReferenceNumber
            });
        }

        // =========================================================
        // DELETE INCOME
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteIncome(int id)
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var income =
                await _context.Incomes
                    .FirstOrDefaultAsync(
                        i => i.IncomeId == id && i.CustomerId == customerId);

            if (income == null)
            {
                return NotFound(new
                {
                    message = "INCOME RECORD NOT FOUND."
                });
            }

            _context.Incomes.Remove(income);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "INCOME RECORD DELETED SUCCESSFULLY.",
                incomeId = id
            });
        }

        // =========================================================
        // INCOME SUMMARY
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetIncomeSummary()
        {
            var customerId = GetCurrentCustomerId() ?? 1;

            var totalIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;

            var totalRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .CountAsync();

            var byCategory =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i => i.CustomerId == customerId)
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();

            return Ok(new
            {
                totalRecords,
                totalIncome,
                byCategory
            });
        }

        // =========================================================
        // INCOME SUMMARY BY DATE RANGE
        // =========================================================

        [HttpGet("summary/range")]
        public async Task<IActionResult>
            GetIncomeSummaryByRange(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate)
        {
            if (endDate.Date < startDate.Date)
            {
                return BadRequest(new
                {
                    message = "END DATE CANNOT BE EARLIER THAN START DATE."
                });
            }

            var start = startDate.Date;
            var end = endDate.Date.AddDays(1);
            var customerId = GetCurrentCustomerId() ?? 1;

            var records =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.CustomerId == customerId &&
                        i.IncomeDate >= start &&
                        i.IncomeDate < end)
                    .ToListAsync();

            var totalIncome =
                records.Sum(i => i.Amount);

            var byCategory =
                records
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToList();

            return Ok(new
            {
                startDate = start,
                endDate = endDate.Date,
                totalRecords = records.Count,
                totalIncome,
                byCategory
            });
        }

        // =========================================================
        // GET CURRENT CUSTOMER ID
        // =========================================================

        private int? GetCurrentCustomerId()
        {
            var claim =
                User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst("customerId")?.Value
                ?? User.FindFirst("customer_id")?.Value;

            return int.TryParse(claim, out var customerId) && customerId > 0
                ? customerId
                : null;
        }
    }
}
