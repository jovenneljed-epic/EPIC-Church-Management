
using System.Security.Claims;

using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    // =========================================================
    // CLIENT PORTAL MEMBERS
    //
    // This controller is intentionally separate from:
    //
    // ClientMembersController
    //
    // ClientMembersController = ADMIN management of
    // client login accounts.
    //
    // ClientPortalMembersController = authenticated
    // church/customer member directory.
    // =========================================================

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientPortalMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClientPortalMembersController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET CURRENT CLIENT'S MEMBERS
        //
        // GET: api/ClientPortalMembers
        //
        // IMPORTANT:
        //
        // CustomerId comes from the authenticated JWT.
        //
        // The frontend does NOT provide CustomerId.
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetMembers()
        {
            var customerId =
                GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Authenticated customer could not be determined."
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
                return NotFound(new
                {
                    message =
                        "Customer account was not found."
                });
            }

            if (!IsActiveCustomerStatus(
                    customer.Status))
            {
                return Forbid();
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
        // GET: api/ClientPortalMembers/{id}
        //
        // SECURITY:
        //
        // The member MUST belong to the authenticated customer.
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetMember(
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
                GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Authenticated customer could not be determined."
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
        // POST: api/ClientPortalMembers
        //
        // IMPORTANT:
        //
        // CustomerId is NOT accepted from the frontend.
        //
        // MemberCode is NOT accepted from the frontend.
        //
        // Both are controlled by the API.
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateMember(
            [FromBody] CreateClientPortalMemberRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member information is required."
                });
            }

            var customerId =
                GetAuthenticatedCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Authenticated customer could not be determined."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER
            // -----------------------------------------------------

            var customer =
                await _context.Customers
                    .FirstOrDefaultAsync(c =>
                        c.CustomerId ==
                        customerId.Value);

            if (customer == null)
            {
                return NotFound(new
                {
                    message =
                        "Customer account was not found."
                });
            }

            if (!IsActiveCustomerStatus(
                    customer.Status))
            {
                return BadRequest(new
                {
                    message =
                        "Customer account is not active."
                });
            }

            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            var firstName =
                request.FirstName?.Trim();

            var middleName =
                NormalizeNullable(
                    request.MiddleName);

            var lastName =
                request.LastName?.Trim();

            if (string.IsNullOrWhiteSpace(
                    firstName))
            {
                return BadRequest(new
                {
                    message =
                        "First name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    lastName))
            {
                return BadRequest(new
                {
                    message =
                        "Last name is required."
                });
            }

            if (firstName.Length > 100)
            {
                return BadRequest(new
                {
                    message =
                        "First name is too long."
                });
            }

            if (lastName.Length > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Last name is too long."
                });
            }

            // -----------------------------------------------------
            // NORMALIZE STATUS
            // -----------------------------------------------------

            var status =
                string.IsNullOrWhiteSpace(
                    request.Status)
                    ? "ACTIVE"
                    : request.Status
                        .Trim()
                        .ToUpperInvariant();

            var allowedStatuses =
                new[]
                {
                    "ACTIVE",
                    "INACTIVE"
                };

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid status. Allowed values: ACTIVE, INACTIVE."
                });
            }

            // -----------------------------------------------------
            // DUPLICATE CHECK
            //
            // Only inside the authenticated customer.
            // -----------------------------------------------------

            var duplicate =
                await _context.Members
                    .AnyAsync(m =>
                        m.CustomerId ==
                            customerId.Value &&
                        m.FirstName != null &&
                        m.LastName != null &&
                        m.FirstName.Trim()
                            .ToUpper() ==
                            firstName
                                .Trim()
                                .ToUpper() &&
                        m.LastName.Trim()
                            .ToUpper() ==
                            lastName
                                .Trim()
                                .ToUpper());

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "A member with the same first name and last name already exists in your church."
                });
            }

            // -----------------------------------------------------
            // GENERATE MEMBER CODE
            // -----------------------------------------------------

            var memberCode =
                await GenerateMemberCode(
                    customerId.Value);

            // -----------------------------------------------------
            // CREATE MEMBER
            // -----------------------------------------------------

            var member =
                new Member
                {
                    CustomerId =
                        customerId.Value,

                    MemberCode =
                        memberCode,

                    FirstName =
                        firstName,

                    MiddleName =
                        middleName,

                    LastName =
                        lastName,

                    Gender =
                        NormalizeNullable(
                            request.Gender),

                    BirthDate =
                        request.BirthDate,

                    ContactNumber =
                        NormalizeNullable(
                            request.ContactNumber),

                    Address =
                        NormalizeNullable(
                            request.Address),

                    CivilStatus =
                        NormalizeNullable(
                            request.CivilStatus),

                    Ministry =
                        NormalizeNullable(
                            request.Ministry),

                    DateJoined =
                        request.DateJoined,

                    Status =
                        status,

                    PhotoPath =
                        null,

                    CreatedDate =
                        DateTime.UtcNow,

                    UpdatedDate =
                        null
                };

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return CreatedAtAction(
                nameof(GetMember),
                new
                {
                    id =
                        member.MemberId
                },
                new
                {
                    message =
                        "MEMBER ADDED SUCCESSFULLY.",

                    memberId =
                        member.MemberId,

                    customerId =
                        member.CustomerId,

                    memberCode =
                        member.MemberCode,

                    memberName =
                        GetMemberFullName(
                            member),

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

                    createdDate =
                        member.CreatedDate
                });
        }

        // =========================================================
        // PRIVATE
        // GET AUTHENTICATED CUSTOMER ID
        // =========================================================

        private int? GetAuthenticatedCustomerId()
        {
            /*
             * We intentionally support several claim names
             * because the exact claim name can differ depending
             * on how ClientAuthController creates the JWT.
             */

            var possibleClaims =
                new[]
                {
                    "CustomerId",
                    "customerId",
                    "customer_id",
                    "CustomerID"
                };

            foreach (var claimName in possibleClaims)
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

            return null;
        }

        // =========================================================
        // PRIVATE
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
        // PRIVATE
        // NORMALIZE NULLABLE STRING
        // =========================================================

        private static string? NormalizeNullable(
            string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var result =
                value.Trim();

            if (
                string.Equals(
                    result,
                    "N/A",
                    StringComparison.OrdinalIgnoreCase)
            )
            {
                return null;
            }

            return result;
        }

        // =========================================================
        // PRIVATE
        // FULL NAME
        // =========================================================

        private static string GetMemberFullName(
            Member member)
        {
            var parts =
                new[]
                {
                    member.FirstName,
                    member.MiddleName,
                    member.LastName
                }
                .Where(value =>
                    !string.IsNullOrWhiteSpace(
                        value) &&
                    !string.Equals(
                        value.Trim(),
                        "N/A",
                        StringComparison.OrdinalIgnoreCase))
                .Select(value =>
                    value!.Trim());

            return string.Join(
                " ",
                parts);
        }

        // =========================================================
        // PRIVATE
        // MEMBER CODE
        //
        // Generates the next M0001-style code.
        //
        // Existing MemberCode values are examined so this does
        // not depend on MemberId being sequential.
        // =========================================================

        private async Task<string> GenerateMemberCode(
            int customerId)
        {
            var existingCodes =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.CustomerId ==
                            customerId &&
                        m.MemberCode != null)
                    .Select(m =>
                        m.MemberCode!)
                    .ToListAsync();

            var highestNumber = 0;

            foreach (var code in existingCodes)
            {
                if (string.IsNullOrWhiteSpace(code))
                {
                    continue;
                }

                var normalized =
                    code.Trim()
                        .ToUpperInvariant();

                if (!normalized.StartsWith("M"))
                {
                    continue;
                }

                var numberPart =
                    normalized
                        .Substring(1);

                if (
                    int.TryParse(
                        numberPart,
                        out var number) &&
                    number > highestNumber
                )
                {
                    highestNumber =
                        number;
                }
            }

            return $"M{highestNumber + 1:0000}";
        }
    }

    // =============================================================
    // REQUEST MODEL
    // =============================================================

    public class CreateClientPortalMemberRequest
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
}

