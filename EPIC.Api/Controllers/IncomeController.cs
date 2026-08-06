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
        //
        // GET /api/Income
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetIncome()
        {
            var income = await _context.Incomes
                .AsNoTracking()
                .OrderByDescending(i => i.IncomeDate)
                .ThenByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }


        // =========================================================
        // GET INCOME BY ID
        //
        // GET /api/Income/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIncomeById(int id)
        {
            var income = await _context.Incomes
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IncomeId == id);

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
        //
        // GET /api/Income/date?date=2026-08-02
        // =========================================================

        [HttpGet("date")]
        public async Task<IActionResult> GetIncomeByDate(
            [FromQuery] DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var income = await _context.Incomes
                .AsNoTracking()
                .Where(i =>
                    i.IncomeDate >= startDate &&
                    i.IncomeDate < endDate)
                .OrderByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }


        // =========================================================
        // GET INCOME BY CATEGORY
        //
        // GET /api/Income/category?category=RENTAL
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

            var categoryName =
                category.Trim().ToUpper();

            var income = await _context.Incomes
                .AsNoTracking()
                .Where(i =>
                    i.Category == categoryName)
                .OrderByDescending(i => i.IncomeDate)
                .ThenByDescending(i => i.IncomeId)
                .ToListAsync();

            return Ok(income);
        }


        // =========================================================
        // FINANCIAL DASHBOARD
        //
        // GET /api/Income/dashboard
        //
        // CALCULATES:
        //
        // TOTAL INCOME
        // TOTAL EXPENSES
        // NET CHURCH FUNDS
        //
        // NET CHURCH FUNDS =
        // TOTAL INCOME - TOTAL EXPENSES
        // =========================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetIncomeDashboard()
        {
            // =====================================================
            // DATE SETTINGS
            // =====================================================

            var today = DateTime.Today;

            var tomorrow =
                today.AddDays(1);

            var firstDayOfMonth =
                new DateTime(
                    today.Year,
                    today.Month,
                    1);

            var firstDayOfNextMonth =
                firstDayOfMonth.AddMonths(1);


            // =====================================================
            // TOTAL INCOME
            // =====================================================

            var totalIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;


            // =====================================================
            // TODAY'S INCOME
            // =====================================================

            var todayIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.IncomeDate >= today &&
                        i.IncomeDate < tomorrow)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;


            // =====================================================
            // MONTHLY INCOME
            // =====================================================

            var monthlyIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.IncomeDate >= firstDayOfMonth &&
                        i.IncomeDate < firstDayOfNextMonth)
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;


            // =====================================================
            // INCOME RECORD COUNTS
            // =====================================================

            var totalIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .CountAsync();

            var todayIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .CountAsync(i =>
                        i.IncomeDate >= today &&
                        i.IncomeDate < tomorrow);

            var monthlyIncomeRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .CountAsync(i =>
                        i.IncomeDate >= firstDayOfMonth &&
                        i.IncomeDate < firstDayOfNextMonth);


            // =====================================================
            // TOTAL EXPENSES
            //
            // THIS READS DIRECTLY FROM EXPENSES TABLE
            // =====================================================

            var totalExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;


            // =====================================================
            // TODAY'S EXPENSES
            // =====================================================

            var todayExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;


            // =====================================================
            // MONTHLY EXPENSES
            // =====================================================

            var monthlyExpenses =
                await _context.Expenses
                    .AsNoTracking()
                    .Where(e =>
                        e.ExpenseDate >= firstDayOfMonth &&
                        e.ExpenseDate < firstDayOfNextMonth)
                    .SumAsync(e => (decimal?)e.Amount)
                ?? 0m;


            // =====================================================
            // EXPENSE RECORD COUNTS
            // =====================================================

            var totalExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync();

            var todayExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync(e =>
                        e.ExpenseDate >= today &&
                        e.ExpenseDate < tomorrow);

            var monthlyExpenseRecords =
                await _context.Expenses
                    .AsNoTracking()
                    .CountAsync(e =>
                        e.ExpenseDate >= firstDayOfMonth &&
                        e.ExpenseDate < firstDayOfNextMonth);


            // =====================================================
            // NET CHURCH FUNDS
            //
            // INCOME - EXPENSES
            // =====================================================

            var netChurchFunds =
                totalIncome - totalExpenses;


            // =====================================================
            // TODAY NET FUNDS
            // =====================================================

            var todayNetFunds =
                todayIncome - todayExpenses;


            // =====================================================
            // MONTHLY NET FUNDS
            // =====================================================

            var monthlyNetFunds =
                monthlyIncome - monthlyExpenses;


            // =====================================================
            // INCOME CATEGORY BREAKDOWN
            // =====================================================

            var incomeCategoryBreakdown =
                await _context.Incomes
                    .AsNoTracking()
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category = g.Key,

                        total =
                            g.Sum(i => i.Amount),

                        records =
                            g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();


            // =====================================================
            // EXPENSE CATEGORY BREAKDOWN
            // =====================================================

            var expenseCategoryBreakdown =
                await _context.Expenses
                    .AsNoTracking()
                    .GroupBy(e => e.Category)
                    .Select(g => new
                    {
                        category = g.Key,

                        total =
                            g.Sum(e => e.Amount),

                        records =
                            g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();


            // =====================================================
            // COMPLETE FINANCIAL DASHBOARD
            // =====================================================

            return Ok(new
            {
                // =================================================
                // INCOME
                // =================================================

                totalIncome,

                todayIncome,

                monthlyIncome,

                totalRecords =
                    totalIncomeRecords,

                todayRecords =
                    todayIncomeRecords,

                monthlyRecords =
                    monthlyIncomeRecords,


                // =================================================
                // EXPENSES
                // =================================================

                totalExpenses,

                todayExpenses,

                monthlyExpenses,

                totalExpenseRecords,

                todayExpenseRecords,

                monthlyExpenseRecords,


                // =================================================
                // NET CHURCH FUNDS
                // =================================================

                netChurchFunds,

                todayNetFunds,

                monthlyNetFunds,


                // =================================================
                // BREAKDOWNS
                // =================================================

                incomeCategoryBreakdown,

                expenseCategoryBreakdown,


                // =================================================
                // FINANCIAL POSITION
                // =================================================

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
        //
        // POST /api/Income
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateIncome(
            [FromBody] Income income)
        {
            if (income == null)
            {
                return BadRequest(new
                {
                    message =
                        "INCOME INFORMATION IS REQUIRED."
                });
            }


            // =====================================================
            // CATEGORY
            // =====================================================

            if (string.IsNullOrWhiteSpace(
                income.Category))
            {
                return BadRequest(new
                {
                    message =
                        "CATEGORY IS REQUIRED."
                });
            }


            // =====================================================
            // DESCRIPTION
            // =====================================================

            if (string.IsNullOrWhiteSpace(
                income.Description))
            {
                return BadRequest(new
                {
                    message =
                        "DESCRIPTION IS REQUIRED."
                });
            }


            // =====================================================
            // AMOUNT
            // =====================================================

            if (income.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "AMOUNT MUST BE GREATER THAN ZERO."
                });
            }


            // =====================================================
            // CLEAN DATA
            // =====================================================

            income.Category =
                income.Category
                    .Trim()
                    .ToUpper();

            income.Description =
                income.Description.Trim();


            // =====================================================
            // DATE
            // =====================================================

            if (income.IncomeDate == default)
            {
                income.IncomeDate =
                    DateTime.Today;
            }


            // =====================================================
            // PAYMENT METHOD
            // =====================================================

            income.PaymentMethod =
                income.PaymentMethod?
                    .Trim()
                    .ToUpper()
                ?? "";


            // =====================================================
            // REFERENCE NUMBER
            // =====================================================

            income.ReferenceNumber =
                income.ReferenceNumber?
                    .Trim()
                ?? "";


            // =====================================================
            // RECORDED BY
            // =====================================================

            income.RecordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";


            income.RecordedDate =
                DateTime.Now;


            // =====================================================
            // SAVE
            // =====================================================

            _context.Incomes.Add(income);

            await _context.SaveChangesAsync();


            // =====================================================
            // RESPONSE
            // =====================================================

            return CreatedAtAction(
                nameof(GetIncomeById),

                new
                {
                    id = income.IncomeId
                },

                new
                {
                    message =
                        "INCOME RECORDED SUCCESSFULLY.",

                    incomeId =
                        income.IncomeId,

                    category =
                        income.Category,

                    description =
                        income.Description,

                    amount =
                        income.Amount,

                    incomeDate =
                        income.IncomeDate,

                    paymentMethod =
                        income.PaymentMethod,

                    referenceNumber =
                        income.ReferenceNumber,

                    recordedBy =
                        income.RecordedBy,

                    recordedDate =
                        income.RecordedDate
                });
        }


        // =========================================================
        // UPDATE INCOME
        //
        // PUT /api/Income/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateIncome(
            int id,
            [FromBody] Income updatedIncome)
        {
            var income =
                await _context.Incomes
                    .FirstOrDefaultAsync(
                        i => i.IncomeId == id);


            // =====================================================
            // CHECK RECORD
            // =====================================================

            if (income == null)
            {
                return NotFound(new
                {
                    message =
                        "INCOME RECORD NOT FOUND."
                });
            }


            // =====================================================
            // CHECK DATA
            // =====================================================

            if (updatedIncome == null)
            {
                return BadRequest(new
                {
                    message =
                        "INCOME INFORMATION IS REQUIRED."
                });
            }


            // =====================================================
            // CATEGORY
            // =====================================================

            if (string.IsNullOrWhiteSpace(
                updatedIncome.Category))
            {
                return BadRequest(new
                {
                    message =
                        "CATEGORY IS REQUIRED."
                });
            }


            // =====================================================
            // DESCRIPTION
            // =====================================================

            if (string.IsNullOrWhiteSpace(
                updatedIncome.Description))
            {
                return BadRequest(new
                {
                    message =
                        "DESCRIPTION IS REQUIRED."
                });
            }


            // =====================================================
            // AMOUNT
            // =====================================================

            if (updatedIncome.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "AMOUNT MUST BE GREATER THAN ZERO."
                });
            }


            // =====================================================
            // UPDATE CATEGORY
            // =====================================================

            income.Category =
                updatedIncome.Category
                    .Trim()
                    .ToUpper();


            // =====================================================
            // UPDATE DESCRIPTION
            // =====================================================

            income.Description =
                updatedIncome.Description
                    .Trim();


            // =====================================================
            // UPDATE AMOUNT
            // =====================================================

            income.Amount =
                updatedIncome.Amount;


            // =====================================================
            // UPDATE DATE
            // =====================================================

            income.IncomeDate =
                updatedIncome.IncomeDate == default
                    ? income.IncomeDate
                    : updatedIncome.IncomeDate;


            // =====================================================
            // UPDATE PAYMENT METHOD
            // =====================================================

            income.PaymentMethod =
                updatedIncome.PaymentMethod?
                    .Trim()
                    .ToUpper()
                ?? "";


            // =====================================================
            // UPDATE REFERENCE
            // =====================================================

            income.ReferenceNumber =
                updatedIncome.ReferenceNumber?
                    .Trim()
                ?? "";


            // =====================================================
            // UPDATED BY
            // =====================================================

            income.RecordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? income.RecordedBy;


            income.RecordedDate =
                DateTime.Now;


            // =====================================================
            // SAVE UPDATE
            // =====================================================

            await _context.SaveChangesAsync();


            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "INCOME UPDATED SUCCESSFULLY.",

                incomeId =
                    income.IncomeId,

                category =
                    income.Category,

                description =
                    income.Description,

                amount =
                    income.Amount,

                incomeDate =
                    income.IncomeDate,

                paymentMethod =
                    income.PaymentMethod,

                referenceNumber =
                    income.ReferenceNumber
            });
        }


        // =========================================================
        // DELETE INCOME
        //
        // DELETE /api/Income/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteIncome(
            int id)
        {
            var income =
                await _context.Incomes
                    .FirstOrDefaultAsync(
                        i => i.IncomeId == id);


            // =====================================================
            // CHECK RECORD
            // =====================================================

            if (income == null)
            {
                return NotFound(new
                {
                    message =
                        "INCOME RECORD NOT FOUND."
                });
            }


            // =====================================================
            // DELETE
            // =====================================================

            _context.Incomes.Remove(income);

            await _context.SaveChangesAsync();


            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "INCOME RECORD DELETED SUCCESSFULLY.",

                incomeId =
                    id
            });
        }


        // =========================================================
        // INCOME SUMMARY
        //
        // GET /api/Income/summary
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetIncomeSummary()
        {
            var totalIncome =
                await _context.Incomes
                    .AsNoTracking()
                    .SumAsync(i => (decimal?)i.Amount)
                ?? 0m;


            var totalRecords =
                await _context.Incomes
                    .AsNoTracking()
                    .CountAsync();


            var byCategory =
                await _context.Incomes
                    .AsNoTracking()
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category =
                            g.Key,

                        total =
                            g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(
                        x => x.total)
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
        //
        // GET /api/Income/summary/range
        // =========================================================

        [HttpGet("summary/range")]
        public async Task<IActionResult>
            GetIncomeSummaryByRange(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate)
        {
            // =====================================================
            // VALIDATE DATE
            // =====================================================

            if (endDate.Date < startDate.Date)
            {
                return BadRequest(new
                {
                    message =
                        "END DATE CANNOT BE EARLIER THAN START DATE."
                });
            }


            // =====================================================
            // DATE RANGE
            // =====================================================

            var start =
                startDate.Date;

            var end =
                endDate.Date.AddDays(1);


            // =====================================================
            // GET RECORDS
            // =====================================================

            var records =
                await _context.Incomes
                    .AsNoTracking()
                    .Where(i =>
                        i.IncomeDate >= start &&
                        i.IncomeDate < end)
                    .ToListAsync();


            // =====================================================
            // TOTAL
            // =====================================================

            var totalIncome =
                records.Sum(i => i.Amount);


            // =====================================================
            // CATEGORY BREAKDOWN
            // =====================================================

            var byCategory =
                records
                    .GroupBy(i => i.Category)
                    .Select(g => new
                    {
                        category =
                            g.Key,

                        total =
                            g.Sum(i => i.Amount)
                    })
                    .OrderByDescending(
                        x => x.total)
                    .ToList();


            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                startDate =
                    start,

                endDate =
                    endDate.Date,

                totalRecords =
                    records.Count,

                totalIncome,

                byCategory
            });
        }
    }
}