
using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GivingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;

        // =========================================================
        // ALLOWED GIVING TYPES
        // =========================================================

        private static readonly HashSet<string> AllowedGivingTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "TITHE",
                "OFFERING",
                "MISSION",
                "SPECIAL OFFERING",
                "PLEDGE",
                "OTHER"
            };

        // =========================================================
        // ALLOWED PAYMENT METHODS
        // =========================================================

        private static readonly HashSet<string> AllowedPaymentMethods =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "CASH",
                "GCASH",
                "BANK TRANSFER",
                "CHECK",
                "OTHER"
            };

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public GivingController(
            ApplicationDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // =========================================================
        // CURRENT USER ID
        // =========================================================

        private int? CurrentUserId
        {
            get
            {
                var value =
                    User.FindFirst("userId")?.Value
                    ??
                    User.FindFirst(
                        ClaimTypes.NameIdentifier)?.Value;

                return int.TryParse(
                    value,
                    out var id) &&
                    id > 0
                        ? id
                        : null;
            }
        }

        // =========================================================
        // CURRENT ROLE
        // =========================================================

        private string CurrentRole
        {
            get
            {
                var role =
                    User.FindFirst(
                        ClaimTypes.Role)?.Value
                    ??
                    User.FindFirst(
                        "role")?.Value;

                return string.IsNullOrWhiteSpace(role)
                    ? string.Empty
                    : role.Trim().ToUpperInvariant();
            }
        }

        // =========================================================
        // CLIENT ROLE FAMILY
        // =========================================================

        private bool IsClientRole
        {
            get
            {
                return
                    CurrentRole == "CLIENT" ||
                    CurrentRole.StartsWith("CLIENT_");
            }
        }

        // =========================================================
        // CURRENT CLIENT MEMBER ID
        // =========================================================

        private int? CurrentClientMemberId
        {
            get
            {
                var value =
                    User.FindFirst(
                        "clientMemberId")?.Value
                    ??
                    User.FindFirst(
                        "ClientMemberId")?.Value;

                return int.TryParse(
                    value,
                    out var id) &&
                    id > 0
                        ? id
                        : null;
            }
        }

        // =========================================================
        // JWT CUSTOMER ID
        //
        // FALLBACK ONLY
        // =========================================================

        private int? GetCustomerIdFromToken()
        {
            var value =
                User.FindFirst("customerId")?.Value
                ??
                User.FindFirst("CustomerId")?.Value
                ??
                User.FindFirst("tenantId")?.Value;

            return int.TryParse(
                value,
                out var id) &&
                id > 0
                    ? id
                    : null;
        }

        // =========================================================
        // GET CURRENT CUSTOMER ID
        //
        // CLIENT:
        //
        // clientMemberId
        //      ↓
        // ClientMembers
        //      ↓
        // CustomerId
        //
        // ADMIN:
        //
        // UserId
        //      ↓
        // Users
        //      ↓
        // CustomerId
        // =========================================================

        private async Task<int?>
            GetCurrentCustomerIdAsync()
        {
            // =====================================================
            // CLIENT
            // =====================================================

            if (IsClientRole)
            {
                var clientMemberId =
                    CurrentClientMemberId;

                if (!clientMemberId.HasValue)
                {
                    return null;
                }

                var client =
                    await _context.ClientMembers
                        .AsNoTracking()
                        .Where(cm =>
                            cm.ClientMemberId ==
                                clientMemberId.Value &&

                            cm.IsActive &&

                            cm.Status != null &&

                            cm.Status.Trim().ToUpper() ==
                                "ACTIVE")
                        .Select(cm => new
                        {
                            CustomerId =
                                cm.CustomerId,

                            CustomerStatus =
                                cm.Customer != null
                                    ? cm.Customer.Status
                                    : null,

                            MemberStatus =
                                cm.Member != null
                                    ? cm.Member.Status
                                    : null,

                            ClientRoleActive =
                                cm.ClientRole != null &&
                                cm.ClientRole.IsActive
                        })
                        .FirstOrDefaultAsync();

                if (client == null)
                {
                    return null;
                }

                if (client.CustomerId <= 0)
                {
                    return null;
                }

                if (!string.Equals(
                    client.CustomerStatus?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!string.Equals(
                    client.MemberStatus?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!client.ClientRoleActive)
                {
                    return null;
                }

                return client.CustomerId;
            }

            // =====================================================
            // ADMIN
            // =====================================================

            if (CurrentRole == "ADMIN")
            {
                var userId =
                    CurrentUserId;

                if (userId.HasValue)
                {
                    var customerId =
                        await _context.Users
                            .AsNoTracking()
                            .Where(u =>
                                u.UserId ==
                                userId.Value)
                            .Select(u =>
                                u.CustomerId)
                            .FirstOrDefaultAsync();

                    if (customerId > 0)
                    {
                        return customerId;
                    }
                }

                return GetCustomerIdFromToken();
            }

            return null;
        }

        // =========================================================
        // REQUIRE CHURCH ACCESS
        // =========================================================

        private async Task<(
            IActionResult? Error,
            int? CustomerId)>
            RequireChurchAccessAsync()
        {
            // =====================================================
            // AUTHENTICATION
            // =====================================================

            if (User.Identity?.IsAuthenticated != true)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Authentication is required."
                    }),
                    null
                );
            }

            // =====================================================
            // ROLE
            // =====================================================

            if (CurrentRole != "ADMIN" &&
                !IsClientRole)
            {
                return (
                    Forbid(),
                    null
                );
            }

            // =====================================================
            // CLIENT IDENTITY
            // =====================================================

            if (IsClientRole &&
                !CurrentClientMemberId.HasValue)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Client member identity could not be determined.",

                        role =
                            CurrentRole,

                        clientMemberId =
                            CurrentClientMemberId
                    }),
                    null
                );
            }

            // =====================================================
            // CUSTOMER
            // =====================================================

            var customerId =
                await GetCurrentCustomerIdAsync();

            if (!customerId.HasValue ||
                customerId.Value <= 0)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Customer identity could not be determined from the authenticated account.",

                        role =
                            CurrentRole,

                        userId =
                            CurrentUserId,

                        clientMemberId =
                            CurrentClientMemberId,

                        tokenCustomerId =
                            GetCustomerIdFromToken()
                    }),
                    null
                );
            }

            return (
                null,
                customerId.Value
            );
        }

        // =========================================================
        // CUSTOMER-SCOPED GIVING
        // =========================================================

        private IQueryable<Giving>
            CustomerGivings(
                int customerId)
        {
            return _context.Givings
                .Where(g =>
                    g.CustomerId ==
                    customerId);
        }

        // =========================================================
        // GET ALL GIVING
        //
        // GET:
        // api/Giving
        // =========================================================

        [HttpGet]
        [Permission("Giving", "view")]
        public async Task<IActionResult>
            GetGivings()


        {
            Console.WriteLine();
            Console.WriteLine("==========================================");
            Console.WriteLine("EPIC GIVING AUTH DIAGNOSTIC");
            Console.WriteLine($"Authenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"Role: {User.FindFirst(ClaimTypes.Role)?.Value}");
            Console.WriteLine($"role: {User.FindFirst("role")?.Value}");
            Console.WriteLine($"UserId: {User.FindFirst("userId")?.Value}");
            Console.WriteLine($"NameIdentifier: {User.FindFirst(ClaimTypes.NameIdentifier)?.Value}");
            Console.WriteLine($"customerId: {User.FindFirst("customerId")?.Value}");
            Console.WriteLine($"clientMemberId: {User.FindFirst("clientMemberId")?.Value}");
            Console.WriteLine("==========================================");
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var givings =
                    await CustomerGivings(customerId)
                        .AsNoTracking()
                        .Include(g =>
                            g.Member)
                        .Include(g =>
                            g.ChurchService)
                        .OrderByDescending(
                            g => g.GivingDate)
                        .ThenByDescending(
                            g => g.GivingId)
                        .Select(g => new
                        {
                            givingId =
                                g.GivingId,

                            customerId =
                                g.CustomerId,

                            memberId =
                                g.MemberId,

                            memberCode =
                                g.Member != null
                                    ? g.Member.MemberCode
                                    : "",

                            memberName =
                                g.Member != null
                                    ? BuildMemberName(
                                        g.Member)
                                    : "Anonymous",

                            churchServiceId =
                                g.ChurchServiceId,

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
                                g.Notes,

                            recordedBy =
                                g.RecordedBy,

                            recordedDate =
                                g.RecordedDate
                        })
                        .ToListAsync();

                return Ok(givings);
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to load giving records.",
                    ex);
            }
        }

        // =========================================================
        // GET GIVING BY ID
        //
        // GET:
        // api/Giving/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Giving", "view")]
        public async Task<IActionResult>
            GetGiving(int id)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var giving =
                    await CustomerGivings(customerId)
                        .AsNoTracking()
                        .Include(g =>
                            g.Member)
                        .Include(g =>
                            g.ChurchService)
                        .Where(g =>
                            g.GivingId == id)
                        .Select(g => new
                        {
                            givingId =
                                g.GivingId,

                            customerId =
                                g.CustomerId,

                            memberId =
                                g.MemberId,

                            memberCode =
                                g.Member != null
                                    ? g.Member.MemberCode
                                    : "",

                            memberName =
                                g.Member != null
                                    ? BuildMemberName(
                                        g.Member)
                                    : "Anonymous",

                            churchServiceId =
                                g.ChurchServiceId,

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
                                g.Notes,

                            recordedBy =
                                g.RecordedBy,

                            recordedDate =
                                g.RecordedDate
                        })
                        .FirstOrDefaultAsync();

                if (giving == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Giving record not found.",

                        givingId =
                            id
                    });
                }

                return Ok(giving);
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to load the giving record.",
                    ex);
            }
        }

        // =========================================================
        // GIVING DASHBOARD
        //
        // GET:
        // api/Giving/dashboard
        // =========================================================

        [HttpGet("dashboard")]
        [Permission("Giving", "view")]
        public async Task<IActionResult>
            GetDashboard()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var today =
                    DateTime.Today;

                var tomorrow =
                    today.AddDays(1);

                var firstDayOfMonth =
                    new DateTime(
                        today.Year,
                        today.Month,
                        1);

                var firstDayOfNextMonth =
                    firstDayOfMonth.AddMonths(1);

                var givings =
                    CustomerGivings(customerId)
                        .AsNoTracking();

                var totalGiving =
                    await givings
                        .SumAsync(g =>
                            (decimal?)g.Amount)
                    ?? 0m;

                var todayGiving =
                    await givings
                        .Where(g =>
                            g.GivingDate >= today &&
                            g.GivingDate < tomorrow)
                        .SumAsync(g =>
                            (decimal?)g.Amount)
                    ?? 0m;

                var monthlyGiving =
                    await givings
                        .Where(g =>
                            g.GivingDate >=
                                firstDayOfMonth &&
                            g.GivingDate <
                                firstDayOfNextMonth)
                        .SumAsync(g =>
                            (decimal?)g.Amount)
                    ?? 0m;

                var totalRecords =
                    await givings.CountAsync();

                var todayRecords =
                    await givings.CountAsync(g =>
                        g.GivingDate >= today &&
                        g.GivingDate < tomorrow);

                var monthlyRecords =
                    await givings.CountAsync(g =>
                        g.GivingDate >=
                            firstDayOfMonth &&
                        g.GivingDate <
                            firstDayOfNextMonth);

                var typeTotals =
                    await givings
                        .GroupBy(g =>
                            g.GivingType)
                        .Select(g => new
                        {
                            Type =
                                g.Key,

                            Total =
                                g.Sum(x =>
                                    x.Amount)
                        })
                        .ToListAsync();

                decimal GetTypeTotal(
                    string type)
                {
                    return typeTotals
                        .Where(x =>
                            string.Equals(
                                x.Type,
                                type,
                                StringComparison.OrdinalIgnoreCase))
                        .Select(x =>
                            x.Total)
                        .FirstOrDefault();
                }

                return Ok(new
                {
                    customerId,

                    totalGiving,

                    todayGiving,

                    monthlyGiving,

                    totalRecords,

                    todayRecords,

                    monthlyRecords,

                    tithes =
                        GetTypeTotal("TITHE"),

                    offerings =
                        GetTypeTotal("OFFERING"),

                    missions =
                        GetTypeTotal("MISSION"),

                    specialOfferings =
                        GetTypeTotal(
                            "SPECIAL OFFERING"),

                    pledges =
                        GetTypeTotal("PLEDGE"),

                    other =
                        GetTypeTotal("OTHER")
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to load giving dashboard.",
                    ex);
            }
        }

        // =========================================================
        // MEMBER GIVING HISTORY
        //
        // GET:
        // api/Giving/member/{memberId}
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        [Permission("Giving", "view")]
        public async Task<IActionResult>
            GetMemberGiving(int memberId)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var member =
                    await _context.Members
                        .AsNoTracking()
                        .Where(m =>
                            m.MemberId == memberId &&
                            m.CustomerId == customerId)
                        .Select(m => new
                        {
                            memberId =
                                m.MemberId,

                            memberCode =
                                m.MemberCode,

                            fullName =
                                BuildMemberName(m)
                        })
                        .FirstOrDefaultAsync();

                if (member == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Member not found."
                    });
                }

                var givings =
                    await CustomerGivings(customerId)
                        .AsNoTracking()
                        .Where(g =>
                            g.MemberId == memberId)
                        .Include(g =>
                            g.ChurchService)
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
                    member,

                    totalGiving =
                        givings.Sum(x =>
                            x.amount),

                    records =
                        givings
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to load member giving history.",
                    ex);
            }
        }

        // =========================================================
        // GET GIVING BY DATE
        //
        // GET:
        // api/Giving/date/{date}
        // =========================================================

        [HttpGet("date/{date:datetime}")]
        [Permission("Giving", "view")]
        public async Task<IActionResult>
            GetGivingByDate(DateTime date)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var startDate =
                    date.Date;

                var endDate =
                    startDate.AddDays(1);

                var records =
                    await CustomerGivings(customerId)
                        .AsNoTracking()
                        .Where(g =>
                            g.GivingDate >= startDate &&
                            g.GivingDate < endDate)
                        .Include(g =>
                            g.Member)
                        .Include(g =>
                            g.ChurchService)
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
                                    ? BuildMemberName(
                                        g.Member)
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
                        records.Sum(x =>
                            x.amount),

                    records
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to load giving records for the selected date.",
                    ex);
            }
        }

        // =========================================================
        // CREATE GIVING
        //
        // POST:
        // api/Giving
        // =========================================================

        [HttpPost]
        [Permission("Giving", "create")]
        public async Task<IActionResult>
            CreateGiving(
                [FromBody] GivingRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Giving information is required."
                    });
                }

                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                if (request.Amount <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "Giving amount must be greater than zero."
                    });
                }

                var givingType =
                    NormalizeGivingType(
                        request.GivingType);

                if (!AllowedGivingTypes.Contains(
                    givingType))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Invalid giving type: {givingType}",

                        allowedGivingTypes =
                            AllowedGivingTypes
                                .OrderBy(x => x)
                                .ToArray()
                    });
                }

                var paymentMethod =
                    NormalizePaymentMethod(
                        request.PaymentMethod);

                if (!AllowedPaymentMethods.Contains(
                    paymentMethod))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Invalid payment method: {paymentMethod}",

                        allowedPaymentMethods =
                            AllowedPaymentMethods
                                .OrderBy(x => x)
                                .ToArray()
                    });
                }

                // =================================================
                // MEMBER VALIDATION
                // =================================================

                if (request.MemberId.HasValue)
                {
                    var memberExists =
                        await _context.Members
                            .AsNoTracking()
                            .AnyAsync(m =>
                                m.MemberId ==
                                    request.MemberId.Value &&

                                m.CustomerId ==
                                    customerId);

                    if (!memberExists)
                    {
                        return BadRequest(new
                        {
                            message =
                                "The selected member does not exist for this customer."
                        });
                    }
                }

                // =================================================
                // CHURCH SERVICE VALIDATION
                // =================================================

                if (request.ChurchServiceId.HasValue)
                {
                    var serviceExists =
                        await _context.ChurchServices
                            .AsNoTracking()
                            .AnyAsync(s =>
                                s.ChurchServiceId ==
                                    request.ChurchServiceId.Value &&

                                s.CustomerId ==
                                    customerId);

                    if (!serviceExists)
                    {
                        return BadRequest(new
                        {
                            message =
                                "The selected church service does not exist for this customer."
                        });
                    }
                }

                // =================================================
                // AUDIT
                // =================================================

                var recordedBy =
                    GetCurrentUserName();

                var now =
                    DateTime.Now;

                // =================================================
                // CREATE
                // =================================================

                var giving =
                    new Giving
                    {
                        CustomerId =
                            customerId,

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
                            ??
                            DateTime.Today,

                        PaymentMethod =
                            paymentMethod,

                        ReferenceNumber =
                            request.ReferenceNumber?
                                .Trim()
                            ??
                            string.Empty,

                        Notes =
                            request.Notes?
                                .Trim()
                            ??
                            string.Empty,

                        RecordedBy =
                            recordedBy,

                        RecordedDate =
                            now
                    };

                _context.Givings.Add(giving);

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetGiving),
                    new
                    {
                        id =
                            giving.GivingId
                    },
                    new
                    {
                        message =
                            "Giving recorded successfully.",

                        givingId =
                            giving.GivingId,

                        customerId =
                            giving.CustomerId,

                        amount =
                            giving.Amount,

                        givingType =
                            giving.GivingType
                    });
            }
            catch (DbUpdateException ex)
            {
                return DatabaseError(
                    "Unable to save the giving record.",
                    ex);
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to save the giving record.",
                    ex);
            }
        }

        // =========================================================
        // UPDATE GIVING
        //
        // PUT:
        // api/Giving/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Giving", "edit")]
        public async Task<IActionResult>
            UpdateGiving(
                int id,
                [FromBody] GivingRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Giving information is required."
                    });
                }

                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var giving =
                    await CustomerGivings(customerId)
                        .FirstOrDefaultAsync(g =>
                            g.GivingId == id);

                if (giving == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Giving record not found.",

                        givingId =
                            id
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

                var givingType =
                    NormalizeGivingType(
                        request.GivingType);

                if (!AllowedGivingTypes.Contains(
                    givingType))
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid giving type."
                    });
                }

                var paymentMethod =
                    NormalizePaymentMethod(
                        request.PaymentMethod);

                if (!AllowedPaymentMethods.Contains(
                    paymentMethod))
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid payment method."
                    });
                }

                // =================================================
                // MEMBER VALIDATION
                // =================================================

                if (request.MemberId.HasValue)
                {
                    var memberExists =
                        await _context.Members
                            .AsNoTracking()
                            .AnyAsync(m =>
                                m.MemberId ==
                                    request.MemberId.Value &&

                                m.CustomerId ==
                                    customerId);

                    if (!memberExists)
                    {
                        return BadRequest(new
                        {
                            message =
                                "The selected member does not exist for this customer."
                        });
                    }
                }

                // =================================================
                // CHURCH SERVICE VALIDATION
                // =================================================

                if (request.ChurchServiceId.HasValue)
                {
                    var serviceExists =
                        await _context.ChurchServices
                            .AsNoTracking()
                            .AnyAsync(s =>
                                s.ChurchServiceId ==
                                    request.ChurchServiceId.Value &&

                                s.CustomerId ==
                                    customerId);

                    if (!serviceExists)
                    {
                        return BadRequest(new
                        {
                            message =
                                "The selected church service does not exist for this customer."
                        });
                    }
                }

                // =================================================
                // UPDATE
                // =================================================

                giving.MemberId =
                    request.MemberId;

                giving.ChurchServiceId =
                    request.ChurchServiceId;

                giving.GivingType =
                    givingType;

                giving.Amount =
                    request.Amount;

                if (request.GivingDate.HasValue)
                {
                    giving.GivingDate =
                        request.GivingDate.Value.Date;
                }

                giving.PaymentMethod =
                    paymentMethod;

                giving.ReferenceNumber =
                    request.ReferenceNumber?
                        .Trim()
                    ??
                    string.Empty;

                giving.Notes =
                    request.Notes?
                        .Trim()
                    ??
                    string.Empty;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Giving record updated successfully.",

                    givingId =
                        giving.GivingId,

                    customerId =
                        giving.CustomerId
                });
            }
            catch (DbUpdateException ex)
            {
                return DatabaseError(
                    "Unable to update the giving record.",
                    ex);
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to update the giving record.",
                    ex);
            }
        }

        // =========================================================
        // DELETE GIVING
        //
        // DELETE:
        // api/Giving/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Giving", "delete")]
        public async Task<IActionResult>
            DeleteGiving(int id)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var giving =
                    await CustomerGivings(customerId)
                        .FirstOrDefaultAsync(g =>
                            g.GivingId == id);

                if (giving == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Giving record not found.",

                        givingId =
                            id
                    });
                }

                _context.Givings.Remove(
                    giving);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Giving record deleted successfully.",

                    givingId =
                        id
                });
            }
            catch (DbUpdateException ex)
            {
                return DatabaseError(
                    "Unable to delete the giving record.",
                    ex);
            }
            catch (Exception ex)
            {
                return InternalServerError(
                    "Unable to delete the giving record.",
                    ex);
            }
        }

        // =========================================================
        // NORMALIZE GIVING TYPE
        // =========================================================

        private static string
            NormalizeGivingType(
                string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "OFFERING";
            }

            return value
                .Trim()
                .ToUpperInvariant();
        }

        // =========================================================
        // NORMALIZE PAYMENT METHOD
        // =========================================================

        private static string
            NormalizePaymentMethod(
                string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "CASH";
            }

            return value
                .Trim()
                .ToUpperInvariant();
        }

        // =========================================================
        // MEMBER NAME
        // =========================================================

        private static string
            BuildMemberName(
                Member member)
        {
            var firstName =
                member.FirstName?.Trim()
                ??
                string.Empty;

            var middleName =
                member.MiddleName?.Trim()
                ??
                string.Empty;

            var lastName =
                member.LastName?.Trim()
                ??
                string.Empty;

            var givenName =
                string.Join(
                    " ",
                    new[]
                    {
                        firstName,
                        middleName
                    }
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x)));

            if (string.IsNullOrWhiteSpace(
                lastName))
            {
                return givenName;
            }

            return string.IsNullOrWhiteSpace(
                givenName)
                ? lastName
                : $"{lastName}, {givenName}";
        }

        // =========================================================
        // CURRENT USER NAME
        // =========================================================

        private string
            GetCurrentUserName()
        {
            return
                User.Identity?.Name
                ??
                User.FindFirst(
                    ClaimTypes.Name)?.Value
                ??
                User.FindFirst(
                    "name")?.Value
                ??
                User.FindFirst(
                    "userName")?.Value
                ??
                User.FindFirst(
                    "username")?.Value
                ??
                User.FindFirst(
                    ClaimTypes.Email)?.Value
                ??
                User.FindFirst(
                    "email")?.Value
                ??
                "SYSTEM";
        }

        // =========================================================
        // INTERNAL SERVER ERROR
        // =========================================================

        private IActionResult
            InternalServerError(
                string message,
                Exception ex)
        {
            Console.WriteLine(
                "==========================================");

            Console.WriteLine(
                "EPIC GIVING API ERROR");

            Console.WriteLine(
                $"Message: {message}");

            Console.WriteLine(
                $"Type: {ex.GetType().FullName}");

            Console.WriteLine(
                $"Error: {ex.Message}");

            Console.WriteLine(
                $"Inner: {ex.InnerException?.Message}");

            Console.WriteLine(
                $"InnerInner: {ex.InnerException?.InnerException?.Message}");

            Console.WriteLine(
                $"Stack: {ex.StackTrace}");

            Console.WriteLine(
                "==========================================");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message,

                    exceptionType =
                        ex.GetType().FullName,

                    error =
                        ex.Message,

                    detail =
                        ex.InnerException?.Message,

                    innerException =
                        ex.InnerException?
                            .InnerException?
                            .Message
                });
        }

        // =========================================================
        // DATABASE ERROR
        // =========================================================

        private IActionResult
            DatabaseError(
                string message,
                DbUpdateException ex)
        {
            Console.WriteLine(
                "==========================================");

            Console.WriteLine(
                "EPIC GIVING DATABASE ERROR");

            Console.WriteLine(
                $"Message: {message}");

            Console.WriteLine(
                $"Error: {ex.Message}");

            Console.WriteLine(
                $"Inner: {ex.InnerException?.Message}");

            Console.WriteLine(
                "==========================================");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message,

                    error =
                        ex.Message,

                    detail =
                        ex.InnerException?.Message,

                    exceptionType =
                        ex.GetType().FullName
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
            = string.Empty;

        public string Notes { get; set; }
            = string.Empty;
    }
}

