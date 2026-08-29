using System.Security.Claims;

using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    // =========================================================
    // CLIENT MEMBERS CONTROLLER
    // =========================================================
    //
    // This controller is for the CLIENT PORTAL.
    //
    // SECURITY MODEL:
    //
    // 1. User must be authenticated.
    // 2. CustomerId comes from JWT claims.
    // 3. CustomerId is NEVER accepted from the browser.
    // 4. Every query is restricted to that customer.
    //
    // =========================================================

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClientMembersController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL MEMBERS FOR CURRENT CLIENT
        //
        // GET: api/ClientMembers
        //
        // CustomerId comes from JWT.
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            var customer =
                await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c =>
                        c.CustomerId ==
                        customerId.Value);

            if (customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Your customer account could not be found."
                });
            }

            if (!IsActiveCustomerStatus(
                    customer.Status))
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "Your customer account is not active."
                    });
            }

            var members =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.CustomerId ==
                        customerId.Value)
                    .OrderBy(m => m.LastName)
                    .ThenBy(m => m.FirstName)
                    .ThenBy(m => m.MemberId)
                    .Select(m => new
                    {
                        memberId =
                            m.MemberId,

                        customerId =
                            m.CustomerId,

                        memberCode =
                            m.MemberCode,

                        firstName =
                            m.FirstName,

                        middleName =
                            m.MiddleName,

                        lastName =
                            m.LastName,

                        gender =
                            m.Gender,

                        birthDate =
                            m.BirthDate,

                        contactNumber =
                            m.ContactNumber,

                        address =
                            m.Address,

                        civilStatus =
                            m.CivilStatus,

                        ministry =
                            m.Ministry,

                        dateJoined =
                            m.DateJoined,

                        status =
                            m.Status,

                        photoPath =
                            m.PhotoPath,

                        createdDate =
                            m.CreatedDate,

                        updatedDate =
                            m.UpdatedDate
                    })
                    .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // GET MEMBER BY ID
        //
        // GET: api/ClientMembers/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid MemberId."
                });
            }

            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            var member =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.MemberId == id &&
                        m.CustomerId ==
                            customerId.Value)
                    .Select(m => new
                    {
                        memberId =
                            m.MemberId,

                        customerId =
                            m.CustomerId,

                        memberCode =
                            m.MemberCode,

                        firstName =
                            m.FirstName,

                        middleName =
                            m.MiddleName,

                        lastName =
                            m.LastName,

                        gender =
                            m.Gender,

                        birthDate =
                            m.BirthDate,

                        contactNumber =
                            m.ContactNumber,

                        address =
                            m.Address,

                        civilStatus =
                            m.CivilStatus,

                        ministry =
                            m.Ministry,

                        dateJoined =
                            m.DateJoined,

                        status =
                            m.Status,

                        photoPath =
                            m.PhotoPath,

                        createdDate =
                            m.CreatedDate,

                        updatedDate =
                            m.UpdatedDate
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

            return Ok(member);
        }

        // =========================================================
        // CREATE MEMBER
        //
        // POST: api/ClientMembers
        //
        // IMPORTANT:
        //
        // CustomerId is NOT accepted.
        //
        // MemberCode is NOT accepted.
        //
        // Both are controlled by the server.
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateClientMemberRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member information is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.FirstName))
            {
                return BadRequest(new
                {
                    message =
                        "First name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.LastName))
            {
                return BadRequest(new
                {
                    message =
                        "Last name is required."
                });
            }

            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            // =====================================================
            // CUSTOMER
            // =====================================================

            var customer =
                await _context.Customers
                    .FirstOrDefaultAsync(c =>
                        c.CustomerId ==
                        customerId.Value);

            if (customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Your customer account could not be found."
                });
            }

            if (!IsActiveCustomerStatus(
                    customer.Status))
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "Your customer account is not active."
                    });
            }

            // =====================================================
            // NORMALIZE
            // =====================================================

            var firstName =
                request.FirstName.Trim();

            var middleName =
                NormalizeNullable(
                    request.MiddleName);

            var lastName =
                request.LastName.Trim();

            var gender =
                NormalizeNullable(
                    request.Gender);

            var contactNumber =
                NormalizeNullable(
                    request.ContactNumber);

            var address =
                NormalizeNullable(
                    request.Address);

            var civilStatus =
                NormalizeNullable(
                    request.CivilStatus);

            var ministry =
                NormalizeNullable(
                    request.Ministry);

            var status =
                string.IsNullOrWhiteSpace(
                    request.Status)
                    ? "ACTIVE"
                    : request.Status
                        .Trim()
                        .ToUpperInvariant();

            // =====================================================
            // STATUS VALIDATION
            // =====================================================

            var allowedStatuses =
                new[]
                {
                    "ACTIVE",
                    "INACTIVE"
                };

            if (!allowedStatuses.Contains(
                    status))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid member status. Allowed values: ACTIVE, INACTIVE."
                });
            }

            // =====================================================
            // DATE VALIDATION
            // =====================================================

            if (request.BirthDate.HasValue &&
                request.BirthDate.Value >
                    DateTime.UtcNow.Date)
            {
                return BadRequest(new
                {
                    message =
                        "Birth date cannot be in the future."
                });
            }

            if (request.DateJoined.HasValue &&
                request.DateJoined.Value >
                    DateTime.UtcNow.Date)
            {
                return BadRequest(new
                {
                    message =
                        "Date joined cannot be in the future."
                });
            }

            // =====================================================
            // DUPLICATE MEMBER CHECK
            // =====================================================
            //
            // This is intentionally scoped to the customer's
            // own members.
            //
            // =====================================================

            var duplicate =
                await _context.Members
                    .AnyAsync(m =>
                        m.CustomerId ==
                            customerId.Value &&
                        m.FirstName != null &&
                        m.LastName != null &&
                        m.FirstName.Trim()
                            .ToUpper() ==
                            firstName.ToUpperInvariant() &&
                        m.LastName.Trim()
                            .ToUpper() ==
                            lastName.ToUpperInvariant() &&
                        (
                            middleName == null ||
                            m.MiddleName == null ||
                            m.MiddleName.Trim()
                                .ToUpper() ==
                                middleName
                                    .ToUpperInvariant()
                        ));

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "A member with the same name already exists in your church records."
                });
            }

            // =====================================================
            // CREATE MEMBER
            // =====================================================

            var member =
                new Member
                {
                    CustomerId =
                        customerId.Value,

                    FirstName =
                        firstName,

                    MiddleName =
                        middleName,

                    LastName =
                        lastName,

                    Gender =
                        gender,

                    BirthDate =
                        request.BirthDate,

                    ContactNumber =
                        contactNumber,

                    Address =
                        address,

                    CivilStatus =
                        civilStatus,

                    Ministry =
                        ministry,

                    DateJoined =
                        request.DateJoined,

                    Status =
                        status,

                    CreatedDate =
                        DateTime.UtcNow,

                    UpdatedDate =
                        DateTime.UtcNow
                };

            // =====================================================
            // MEMBER CODE
            // =====================================================
            //
            // We first save the member so MemberId is generated.
            //
            // Then we create the final MemberCode from MemberId.
            //
            // Example:
            //
            // M0001
            // M0002
            // M0167
            //
            // =====================================================

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // Generate member code using the generated MemberId.
            // -----------------------------------------------------

            member.MemberCode =
                $"M{member.MemberId:D4}";

            member.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "MEMBER ADDED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                customerId =
                    member.CustomerId,

                memberCode =
                    member.MemberCode,

                firstName =
                    member.FirstName,

                middleName =
                    member.MiddleName,

                lastName =
                    member.LastName,

                gender =
                    member.Gender,

                birthDate =
                    member.BirthDate,

                contactNumber =
                    member.ContactNumber,

                address =
                    member.Address,

                civilStatus =
                    member.CivilStatus,

                ministry =
                    member.Ministry,

                dateJoined =
                    member.DateJoined,

                status =
                    member.Status,

                photoPath =
                    member.PhotoPath,

                createdDate =
                    member.CreatedDate
            });
        }

        // =========================================================
        // UPDATE MEMBER
        //
        // PUT: api/ClientMembers/{id}
        //
        // CustomerId cannot be changed.
        // MemberCode cannot be changed.
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateClientMemberRequest request)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid MemberId."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member update data is required."
                });
            }

            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == id &&
                        m.CustomerId ==
                            customerId.Value);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "Member not found."
                });
            }

            // =====================================================
            // UPDATE ONLY SUPPLIED VALUES
            // =====================================================

            if (request.FirstName != null)
            {
                var value =
                    request.FirstName.Trim();

                if (string.IsNullOrWhiteSpace(value))
                {
                    return BadRequest(new
                    {
                        message =
                            "First name cannot be empty."
                    });
                }

                member.FirstName =
                    value;
            }

            if (request.MiddleName != null)
            {
                member.MiddleName =
                    NormalizeNullable(
                        request.MiddleName);
            }

            if (request.LastName != null)
            {
                var value =
                    request.LastName.Trim();

                if (string.IsNullOrWhiteSpace(value))
                {
                    return BadRequest(new
                    {
                        message =
                            "Last name cannot be empty."
                    });
                }

                member.LastName =
                    value;
            }

            if (request.Gender != null)
            {
                member.Gender =
                    NormalizeNullable(
                        request.Gender);
            }

            if (request.BirthDate.HasValue)
            {
                if (request.BirthDate.Value >
                    DateTime.UtcNow.Date)
                {
                    return BadRequest(new
                    {
                        message =
                            "Birth date cannot be in the future."
                    });
                }

                member.BirthDate =
                    request.BirthDate;
            }

            if (request.ContactNumber != null)
            {
                member.ContactNumber =
                    NormalizeNullable(
                        request.ContactNumber);
            }

            if (request.Address != null)
            {
                member.Address =
                    NormalizeNullable(
                        request.Address);
            }

            if (request.CivilStatus != null)
            {
                member.CivilStatus =
                    NormalizeNullable(
                        request.CivilStatus);
            }

            if (request.Ministry != null)
            {
                member.Ministry =
                    NormalizeNullable(
                        request.Ministry);
            }

            if (request.DateJoined.HasValue)
            {
                if (request.DateJoined.Value >
                    DateTime.UtcNow.Date)
                {
                    return BadRequest(new
                    {
                        message =
                            "Date joined cannot be in the future."
                    });
                }

                member.DateJoined =
                    request.DateJoined;
            }

            if (request.Status != null)
            {
                var status =
                    request.Status
                        .Trim()
                        .ToUpperInvariant();

                if (status != "ACTIVE" &&
                    status != "INACTIVE")
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid member status."
                    });
                }

                member.Status =
                    status;
            }

            member.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER UPDATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                memberCode =
                    member.MemberCode,

                firstName =
                    member.FirstName,

                middleName =
                    member.MiddleName,

                lastName =
                    member.LastName,

                gender =
                    member.Gender,

                birthDate =
                    member.BirthDate,

                contactNumber =
                    member.ContactNumber,

                address =
                    member.Address,

                civilStatus =
                    member.CivilStatus,

                ministry =
                    member.Ministry,

                dateJoined =
                    member.DateJoined,

                status =
                    member.Status,

                updatedDate =
                    member.UpdatedDate
            });
        }

        // =========================================================
        // CHANGE STATUS
        //
        // PUT: api/ClientMembers/{id}/status
        // =========================================================

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> ChangeStatus(
            int id,
            [FromBody] ChangeMemberStatusRequest request)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid MemberId."
                });
            }

            if (request == null ||
                string.IsNullOrWhiteSpace(
                    request.Status))
            {
                return BadRequest(new
                {
                    message =
                        "Status is required."
                });
            }

            var status =
                request.Status
                    .Trim()
                    .ToUpperInvariant();

            if (status != "ACTIVE" &&
                status != "INACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Invalid status. Allowed values: ACTIVE, INACTIVE."
                });
            }

            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == id &&
                        m.CustomerId ==
                            customerId.Value);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "Member not found."
                });
            }

            member.Status =
                status;

            member.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    status == "ACTIVE"
                        ? "MEMBER ACTIVATED SUCCESSFULLY."
                        : "MEMBER DEACTIVATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                memberCode =
                    member.MemberCode,

                status =
                    member.Status
            });
        }

        // =========================================================
        // DELETE MEMBER
        //
        // DELETE: api/ClientMembers/{id}
        //
        // IMPORTANT:
        // This is restricted to the authenticated customer's
        // own member records.
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid MemberId."
                });
            }

            var customerId =
                await GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Customer authorization information could not be determined from your session."
                });
            }

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == id &&
                        m.CustomerId ==
                            customerId.Value);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "Member not found."
                });
            }

            _context.Members.Remove(member);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER DELETED SUCCESSFULLY.",

                memberId =
                    id,

                memberCode =
                    member.MemberCode
            });
        }

        // =========================================================
        // GET AUTHENTICATED CUSTOMER ID
        // =========================================================
        //
        // Supports common claim names used by JWT implementations.
        //
        // =========================================================

        private async Task<int?> GetAuthenticatedCustomerId()
        {
            var claimNames =
                new[]
                {
                    "CustomerId",
                    "customerId",
                    "customer_id",
                    ClaimTypes.NameIdentifier
                };

            foreach (var claimName in claimNames)
            {
                var value =
                    User.FindFirstValue(
                        claimName);

                if (int.TryParse(
                        value,
                        out var customerId) &&
                    customerId > 0)
                {
                    return customerId;
                }
            }

            // -----------------------------------------------------
            // Some JWT implementations store customer ID as:
            //
            // http://schemas.microsoft.com/ws/2008/06/identity/claims/customerid
            //
            // Search all claims as a fallback.
            // -----------------------------------------------------

            var customerClaim =
                User.Claims.FirstOrDefault(
                    claim =>
                        string.Equals(
                            claim.Type,
                            "CustomerId",
                            StringComparison.OrdinalIgnoreCase) ||
                        claim.Type.EndsWith(
                            "/customerid",
                            StringComparison.OrdinalIgnoreCase));

            if (customerClaim != null &&
                int.TryParse(
                    customerClaim.Value,
                    out var parsedCustomerId) &&
                parsedCustomerId > 0)
            {
                return parsedCustomerId;
            }

            // -----------------------------------------------------
            // If CustomerId is not directly present, try finding
            // the authenticated ClientMember account and obtain
            // its CustomerId.
            //
            // This makes the controller compatible with JWTs that
            // identify the client member by ClientMemberId.
            // -----------------------------------------------------

            var clientMemberIdClaims =
                new[]
                {
                    "ClientMemberId",
                    "clientMemberId",
                    "client_member_id"
                };

            foreach (var claimName
                in clientMemberIdClaims)
            {
                var value =
                    User.FindFirstValue(
                        claimName);

                if (int.TryParse(
                        value,
                        out var clientMemberId) &&
                    clientMemberId > 0)
                {
                    var customerId =
                        await _context.ClientMembers
                            .AsNoTracking()
                            .Where(cm =>
                                cm.ClientMemberId ==
                                clientMemberId)
                            .Select(cm =>
                                (int?)cm.CustomerId)
                            .FirstOrDefaultAsync();

                    if (customerId.HasValue)
                    {
                        return customerId.Value;
                    }
                }
            }

            return null;
        }

        // =========================================================
        // CUSTOMER STATUS
        // =========================================================

        private static bool IsActiveCustomerStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // NORMALIZE NULLABLE STRING
        // =========================================================

        private static string? NormalizeNullable(
            string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim();
        }
    }

    // =============================================================
    // CREATE REQUEST
    // =============================================================

    public class CreateClientMemberRequest
    {
        public string FirstName { get; set; }
            = string.Empty;

        public string? MiddleName { get; set; }

        public string LastName { get; set; }
            = string.Empty;

        public string? Gender { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? ContactNumber { get; set; }

        public string? Address { get; set; }

        public string? CivilStatus { get; set; }

        public string? Ministry { get; set; }

        public DateTime? DateJoined { get; set; }

        public string? Status { get; set; }
    }

    // =============================================================
    // UPDATE REQUEST
    // =============================================================

    public class UpdateClientMemberRequest
    {
        public string? FirstName { get; set; }

        public string? MiddleName { get; set; }

        public string? LastName { get; set; }

        public string? Gender { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? ContactNumber { get; set; }

        public string? Address { get; set; }

        public string? CivilStatus { get; set; }

        public string? Ministry { get; set; }

        public DateTime? DateJoined { get; set; }

        public string? Status { get; set; }
    }

    // =============================================================
    // STATUS REQUEST
    // =============================================================

    public class ChangeMemberStatusRequest
    {
        public string Status { get; set; }
            = string.Empty;
    }
}