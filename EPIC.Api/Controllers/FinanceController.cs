using EPIC.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FinanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // COMPLETE FINANCIAL SUMMARY
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetFinancialSummary()
        {
            var incomes = await _context.Incomes
                .ToListAsync();

            var expenses = await _context.Expenses
                .ToListAsync();

            decimal totalIncome =
                incomes.Sum(i => i.Amount);

            decimal totalExpenses =
                expenses.Sum(e => e.Amount);

            decimal netBalance =
                totalIncome - totalExpenses;


            // -----------------------------------------------------
            // INCOME BY CATEGORY
            // -----------------------------------------------------

            var incomeByCategory =
                incomes
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToList();


            // -----------------------------------------------------
            // EXPENSE BY CATEGORY
            // -----------------------------------------------------

            var expenseByCategory =
                expenses
                    .GroupBy(e => e.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(e => e.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToList();


            return Ok(new
            {
                totalIncome = totalIncome,

                totalExpenses = totalExpenses,

                netBalance = netBalance,

                incomeRecords = incomes.Count,

                expenseRecords = expenses.Count,

                incomeByCategory = incomeByCategory,

                expenseByCategory = expenseByCategory
            });
        }


        // =========================================================
        // FINANCIAL SUMMARY BY DATE RANGE
        // =========================================================

        [HttpGet("summary/range")]
        public async Task<IActionResult> GetFinancialSummaryByRange(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (endDate.Date < startDate.Date)
            {
                return BadRequest(
                    "END DATE CANNOT BE EARLIER THAN START DATE.");
            }


            DateTime start =
                startDate.Date;

            DateTime end =
                endDate.Date.AddDays(1);


            // -----------------------------------------------------
            // GET INCOME
            // -----------------------------------------------------

            var incomes = await _context.Incomes
                .Where(i =>
                    i.IncomeDate >= start &&
                    i.IncomeDate < end)
                .ToListAsync();


            // -----------------------------------------------------
            // GET EXPENSES
            // -----------------------------------------------------

            var expenses = await _context.Expenses
                .Where(e =>
                    e.ExpenseDate >= start &&
                    e.ExpenseDate < end)
                .ToListAsync();


            // -----------------------------------------------------
            // CALCULATE TOTALS
            // -----------------------------------------------------

            decimal totalIncome =
                incomes.Sum(i => i.Amount);

            decimal totalExpenses =
                expenses.Sum(e => e.Amount);

            decimal netBalance =
                totalIncome - totalExpenses;


            // -----------------------------------------------------
            // INCOME BY CATEGORY
            // -----------------------------------------------------

            var incomeByCategory =
                incomes
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToList();


            // -----------------------------------------------------
            // EXPENSE BY CATEGORY
            // -----------------------------------------------------

            var expenseByCategory =
                expenses
                    .GroupBy(e => e.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        total = g.Sum(e => e.Amount)
                    })
                    .OrderByDescending(x => x.total)
                    .ToList();


            return Ok(new
            {
                startDate = startDate.Date,

                endDate = endDate.Date,

                totalIncome = totalIncome,

                totalExpenses = totalExpenses,

                netBalance = netBalance,

                incomeRecords = incomes.Count,

                expenseRecords = expenses.Count,

                incomeByCategory = incomeByCategory,

                expenseByCategory = expenseByCategory
            });
        }


        // =========================================================
        // MONTHLY FINANCIAL SUMMARY
        // =========================================================

        [HttpGet("summary/month")]
        public async Task<IActionResult> GetMonthlySummary(
            [FromQuery] int year,
            [FromQuery] int month)
        {
            if (month < 1 || month > 12)
            {
                return BadRequest(
                    "MONTH MUST BE BETWEEN 1 AND 12.");
            }


            if (year < 2000 || year > 2100)
            {
                return BadRequest(
                    "PLEASE ENTER A VALID YEAR.");
            }


            DateTime startDate =
                new DateTime(year, month, 1);

            DateTime endDate =
                startDate.AddMonths(1);


            var incomes = await _context.Incomes
                .Where(i =>
                    i.IncomeDate >= startDate &&
                    i.IncomeDate < endDate)
                .ToListAsync();


            var expenses = await _context.Expenses
                .Where(e =>
                    e.ExpenseDate >= startDate &&
                    e.ExpenseDate < endDate)
                .ToListAsync();


            decimal totalIncome =
                incomes.Sum(i => i.Amount);

            decimal totalExpenses =
                expenses.Sum(e => e.Amount);

            decimal netBalance =
                totalIncome - totalExpenses;


            return Ok(new
            {
                year = year,

                month = month,

                totalIncome = totalIncome,

                totalExpenses = totalExpenses,

                netBalance = netBalance,

                incomeRecords = incomes.Count,

                expenseRecords = expenses.Count
            });
        }
    }
}