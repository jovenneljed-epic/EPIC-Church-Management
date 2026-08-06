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
    public class GivingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GivingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL GIVING
        //
        // GET /api/Giving
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetGivings()
        {
            var givings = await _context.Givings
                .AsNoTracking()
                .Include(g => g.Member)
                .Include(g => g.ChurchService)
                .OrderByDescending(g => g.GivingDate)
                .ThenByDescending(g => g.GivingId)
                .Select(g => new
                {
                    givingId = g.GivingId,

                    memberId = g.MemberId,

                    memberCode = g.Member != null
                        ? g.Member.MemberCode
                        : "",

                    memberName = g.Member != null
                        ? g.Member.LastName + ", " +
                          g.Member.FirstName +
                          (string.IsNullOrWhiteSpace(g.Member.MiddleName)
                              ? ""
                              : " " + g.Member.MiddleName)
                        : "Anonymous",

                    churchServiceId = g.ChurchServiceId,

                    serviceName = g.ChurchService != null
                        ? g.ChurchService.ServiceName
                        : "",

                    givingType = g.GivingType,

                    amount = g.Amount,

                    givingDate = g.GivingDate,

                    paymentMethod = g.PaymentMethod,

                    referenceNumber = g.ReferenceNumber,

                    notes = g.Notes,

                    recordedBy = g.RecordedBy,

                    recordedDate = g.RecordedDate
                })
                .ToListAsync();

            return Ok(givings);
        }


        // =========================================================
        // GET GIVING BY ID
        //
        // GET /api/Giving/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetGiving(int id)
        {
            var giving = await _context.Givings
                .AsNoTracking()
                .Include(g => g.Member)
                .Include(g => g.ChurchService)
                .Where(g => g.GivingId == id)
                .Select(g => new
                {
                    givingId = g.GivingId,

                    memberId = g.MemberId,

                    memberCode = g.Member != null
                        ? g.Member.MemberCode
                        : "",

                    memberName = g.Member != null
                        ? g.Member.LastName + ", " +
                          g.Member.FirstName +
                          (string.IsNullOrWhiteSpace(g.Member.MiddleName)
                              ? ""
                              : " " + g.Member.MiddleName)
                        : "Anonymous",

                    churchServiceId = g.ChurchServiceId,

                    serviceName = g.ChurchService != null
                        ? g.ChurchService.ServiceName
                        : "",

                    givingType = g.GivingType,

                    amount = g.Amount,

                    givingDate = g.GivingDate,

                    paymentMethod = g.PaymentMethod,

                    referenceNumber = g.ReferenceNumber,

                    notes = g.Notes,

                    recordedBy = g.RecordedBy,

                    recordedDate = g.RecordedDate
                })
                .FirstOrDefaultAsync();

            if (giving == null)
            {
                return NotFound(new
                {
                    message = "Giving record not found."
                });
            }

            return Ok(giving);
        }


        // =========================================================
        // GIVING DASHBOARD
        //
        // GET /api/Giving/dashboard
        // =========================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var today = DateTime.Today;

            var tomorrow = today.AddDays(1);

            var firstDayOfMonth =
                new DateTime(
                    today.Year,
                    today.Month,
                    1);

            var firstDayOfNextMonth =
                firstDayOfMonth.AddMonths(1);


            // =====================================================
            // TOTAL GIVING
            // =====================================================

            var totalGiving =
                await _context.Givings
                    .AsNoTracking()
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // TODAY'S GIVING
            // =====================================================

            var todayGiving =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingDate >= today &&
                        g.GivingDate < tomorrow)
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // THIS MONTH
            // =====================================================

            var monthlyGiving =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingDate >= firstDayOfMonth &&
                        g.GivingDate < firstDayOfNextMonth)
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // RECORD COUNTS
            // =====================================================

            var totalRecords =
                await _context.Givings
                    .CountAsync();

            var todayRecords =
                await _context.Givings
                    .CountAsync(g =>
                        g.GivingDate >= today &&
                        g.GivingDate < tomorrow);

            var monthlyRecords =
                await _context.Givings
                    .CountAsync(g =>
                        g.GivingDate >= firstDayOfMonth &&
                        g.GivingDate < firstDayOfNextMonth);


            // =====================================================
            // TITHE
            // =====================================================

            var tithes =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "TITHE")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // OFFERING
            // =====================================================

            var offerings =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "OFFERING")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // MISSION
            // =====================================================

            var missions =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "MISSION")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // SPECIAL OFFERING
            // =====================================================

            var specialOfferings =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "SPECIAL OFFERING")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // PLEDGE
            // =====================================================

            var pledges =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "PLEDGE")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // OTHER
            // =====================================================

            var other =
                await _context.Givings
                    .AsNoTracking()
                    .Where(g =>
                        g.GivingType == "OTHER")
                    .SumAsync(g => (decimal?)g.Amount)
                ?? 0m;


            // =====================================================
            // RETURN DASHBOARD
            // =====================================================

            return Ok(new
            {
                totalGiving,

                todayGiving,

                monthlyGiving,

                totalRecords,

                todayRecords,

                monthlyRecords,

                tithes,

                offerings,

                missions,

                specialOfferings,

                pledges,

                other
            });
        }


        // =========================================================
        // MEMBER GIVING HISTORY
        //
        // GET /api/Giving/member/{memberId}
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        public async Task<IActionResult> GetMemberGiving(
            int memberId)
        {
            var member = await _context.Members
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.MemberId == memberId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Member not found."
                });
            }

            var givings =
                await _context.Givings
                    .AsNoTracking()
                    .Include(g => g.ChurchService)
                    .Where(g =>
                        g.MemberId == memberId)
                    .OrderByDescending(
                        g => g.GivingDate)
                    .ThenByDescending(
                        g => g.GivingId)
                    .Select(g => new
                    {
                        givingId =
                            g.GivingId,

                        givingType =
                            g.GivingType,

                        amount =
                            g.Amount,

                        givingDate =
                            g.GivingDate,

                        paymentMethod =
                            g.PaymentMethod,

                        referenceNumber =
                            g.ReferenceNumber,

                        serviceName =
                            g.ChurchService != null
                                ? g.ChurchService.ServiceName
                                : "",

                        notes =
                            g.Notes
                    })
                    .ToListAsync();

            return Ok(new
            {
                member = new
                {
                    memberId =
                        member.MemberId,

                    memberCode =
                        member.MemberCode,

                    fullName =
                        member.LastName + ", " +
                        member.FirstName +
                        (string.IsNullOrWhiteSpace(
                            member.MiddleName)
                            ? ""
                            : " " + member.MiddleName)
                },

                totalGiving =
                    givings.Sum(x => x.amount),

                records =
                    givings
            });
        }


        // =========================================================
        // GET GIVING BY DATE
        //
        // GET /api/Giving/date/{date}
        // =========================================================

        [HttpGet("date/{date:datetime}")]
        public async Task<IActionResult> GetGivingByDate(
            DateTime date)
        {
            var startDate =
                date.Date;

            var endDate =
                startDate.AddDays(1);

            var records =
                await _context.Givings
                    .AsNoTracking()
                    .Include(g => g.Member)
                    .Include(g => g.ChurchService)
                    .Where(g =>
                        g.GivingDate >= startDate &&
                        g.GivingDate < endDate)
                    .OrderByDescending(
                        g => g.GivingId)
                    .Select(g => new
                    {
                        givingId =
                            g.GivingId,

                        memberId =
                            g.MemberId,

                        memberName =
                            g.Member != null
                                ? g.Member.LastName +
                                  ", " +
                                  g.Member.FirstName
                                : "Anonymous",

                        serviceName =
                            g.ChurchService != null
                                ? g.ChurchService.ServiceName
                                : "",

                        givingType =
                            g.GivingType,

                        amount =
                            g.Amount,

                        givingDate =
                            g.GivingDate,

                        paymentMethod =
                            g.PaymentMethod,

                        referenceNumber =
                            g.ReferenceNumber,

                        notes =
                            g.Notes
                    })
                    .ToListAsync();

            return Ok(new
            {
                date = startDate,

                total =
                    records.Sum(x => x.amount),

                records
            });
        }


        // =========================================================
        // CREATE GIVING
        //
        // POST /api/Giving
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateGiving(
            [FromBody] GivingRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Giving information is required."
                });
            }


            // =====================================================
            // VALIDATE AMOUNT
            // =====================================================

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Giving amount must be greater than zero."
                });
            }


            // =====================================================
            // VALIDATE GIVING TYPE
            // =====================================================

            var allowedGivingTypes =
                new[]
                {
                    "TITHE",
                    "OFFERING",
                    "MISSION",
                    "SPECIAL OFFERING",
                    "PLEDGE",
                    "OTHER"
                };

            var givingType =
                string.IsNullOrWhiteSpace(
                    request.GivingType)
                    ? "OFFERING"
                    : request.GivingType
                        .Trim()
                        .ToUpper();

            if (!allowedGivingTypes.Contains(
                givingType))
            {
                return BadRequest(new
                {
                    message =
                        $"Invalid giving type: {givingType}",

                    allowedGivingTypes
                });
            }


            // =====================================================
            // VALIDATE PAYMENT METHOD
            // =====================================================

            var allowedPaymentMethods =
                new[]
                {
                    "CASH",
                    "GCASH",
                    "BANK TRANSFER",
                    "CHECK",
                    "OTHER"
                };

            var paymentMethod =
                string.IsNullOrWhiteSpace(
                    request.PaymentMethod)
                    ? "CASH"
                    : request.PaymentMethod
                        .Trim()
                        .ToUpper();

            if (!allowedPaymentMethods.Contains(
                paymentMethod))
            {
                return BadRequest(new
                {
                    message =
                        $"Invalid payment method: {paymentMethod}",

                    allowedPaymentMethods
                });
            }


            // =====================================================
            // VALIDATE MEMBER
            // =====================================================

            if (request.MemberId.HasValue)
            {
                var memberExists =
                    await _context.Members
                        .AnyAsync(m =>
                            m.MemberId ==
                            request.MemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected member does not exist."
                    });
                }
            }


            // =====================================================
            // VALIDATE CHURCH SERVICE
            // =====================================================

            if (request.ChurchServiceId.HasValue)
            {
                var serviceExists =
                    await _context.ChurchServices
                        .AnyAsync(s =>
                            s.ChurchServiceId ==
                            request.ChurchServiceId.Value);

                if (!serviceExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected church service does not exist."
                    });
                }
            }


            // =====================================================
            // RECORDED BY
            // =====================================================

            var recordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";


            // =====================================================
            // CREATE RECORD
            // =====================================================

            var giving =
                new Giving
                {
                    MemberId =
                        request.MemberId,

                    ChurchServiceId =
                        request.ChurchServiceId,

                    GivingType =
                        givingType,

                    Amount =
                        request.Amount,

                    GivingDate =
                        request.GivingDate?.Date
                        ?? DateTime.Today,

                    PaymentMethod =
                        paymentMethod,

                    ReferenceNumber =
                        request.ReferenceNumber?
                            .Trim() ?? "",

                    Notes =
                        request.Notes?
                            .Trim() ?? "",

                    RecordedBy =
                        recordedBy,

                    RecordedDate =
                        DateTime.Now
                };

            _context.Givings.Add(giving);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetGiving),
                new
                {
                    id = giving.GivingId
                },
                new
                {
                    message =
                        "Giving recorded successfully.",

                    givingId =
                        giving.GivingId,

                    amount =
                        giving.Amount,

                    givingType =
                        giving.GivingType
                });
        }


        // =========================================================
        // UPDATE GIVING
        //
        // PUT /api/Giving/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateGiving(
            int id,
            [FromBody] GivingRequest request)
        {
            var giving =
                await _context.Givings
                    .FirstOrDefaultAsync(
                        g =>
                            g.GivingId == id);

            if (giving == null)
            {
                return NotFound(new
                {
                    message =
                        "Giving record not found."
                });
            }


            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Giving information is required."
                });
            }


            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Giving amount must be greater than zero."
                });
            }


            var allowedGivingTypes =
                new[]
                {
                    "TITHE",
                    "OFFERING",
                    "MISSION",
                    "SPECIAL OFFERING",
                    "PLEDGE",
                    "OTHER"
                };

            var givingType =
                request.GivingType?
                    .Trim()
                    .ToUpper();

            if (string.IsNullOrWhiteSpace(
                givingType) ||
                !allowedGivingTypes.Contains(
                    givingType))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid giving type."
                });
            }


            var allowedPaymentMethods =
                new[]
                {
                    "CASH",
                    "GCASH",
                    "BANK TRANSFER",
                    "CHECK",
                    "OTHER"
                };

            var paymentMethod =
                request.PaymentMethod?
                    .Trim()
                    .ToUpper();

            if (string.IsNullOrWhiteSpace(
                paymentMethod) ||
                !allowedPaymentMethods.Contains(
                    paymentMethod))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment method."
                });
            }


            // =====================================================
            // MEMBER
            // =====================================================

            if (request.MemberId.HasValue)
            {
                var memberExists =
                    await _context.Members
                        .AnyAsync(m =>
                            m.MemberId ==
                            request.MemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected member does not exist."
                    });
                }
            }


            // =====================================================
            // CHURCH SERVICE
            // =====================================================

            if (request.ChurchServiceId.HasValue)
            {
                var serviceExists =
                    await _context.ChurchServices
                        .AnyAsync(s =>
                            s.ChurchServiceId ==
                            request.ChurchServiceId.Value);

                if (!serviceExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected church service does not exist."
                    });
                }
            }


            // =====================================================
            // UPDATE
            // =====================================================

            giving.MemberId =
                request.MemberId;

            giving.ChurchServiceId =
                request.ChurchServiceId;

            giving.GivingType =
                givingType;

            giving.Amount =
                request.Amount;

            giving.GivingDate =
                request.GivingDate?.Date
                ?? giving.GivingDate;

            giving.PaymentMethod =
                paymentMethod;

            giving.ReferenceNumber =
                request.ReferenceNumber?
                    .Trim() ?? "";

            giving.Notes =
                request.Notes?
                    .Trim() ?? "";


            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Giving record updated successfully.",

                givingId =
                    giving.GivingId
            });
        }


        // =========================================================
        // DELETE GIVING
        //
        // DELETE /api/Giving/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteGiving(
            int id)
        {
            var giving =
                await _context.Givings
                    .FirstOrDefaultAsync(
                        g =>
                            g.GivingId == id);

            if (giving == null)
            {
                return NotFound(new
                {
                    message =
                        "Giving record not found."
                });
            }


            _context.Givings.Remove(giving);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Giving record deleted successfully."
            });
        }
    }


    // =============================================================
    // REQUEST MODEL
    // =============================================================

    public class GivingRequest
    {
        public int? MemberId { get; set; }

        public int? ChurchServiceId { get; set; }

        public string GivingType { get; set; }
            = "OFFERING";

        public decimal Amount { get; set; }

        public DateTime? GivingDate { get; set; }

        public string PaymentMethod { get; set; }
            = "CASH";

        public string ReferenceNumber { get; set; }
            = "";

        public string Notes { get; set; }
            = "";
    }
}