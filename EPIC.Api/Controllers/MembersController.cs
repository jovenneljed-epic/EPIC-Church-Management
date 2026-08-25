using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly string _photoFolder;

        private static readonly string[] AllowedPhotoExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        private const long MaxPhotoSize = 10 * 1024 * 1024;

        public MembersController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;

            _photoFolder = Path.Combine(
                _environment.ContentRootPath,
                "root-uploads-members");

            Directory.CreateDirectory(_photoFolder);
        }

        // =========================================================
        // GET ALL MEMBERS
        // GET: /api/Members
        // Permission: Members / view
        // =========================================================

        [HttpGet]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMembers()
        {
            var query = GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var members = await query
                .AsNoTracking()
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .Select(m => ToMemberResponseQuery(m))
                .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // GET MY MEMBER PROFILE
        // GET: /api/Members/me
        // Permission: Members / view
        // =========================================================

        [HttpGet("me")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMyProfile()
        {
            var memberId = GetCurrentMemberId();

            if (!memberId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ID WAS NOT FOUND IN AUTHENTICATION TOKEN."
                });
            }

            // -----------------------------------------------------
            // GET TENANT-SCOPED QUERY
            // -----------------------------------------------------

            var query = GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            // -----------------------------------------------------
            // FIND MEMBER
            // -----------------------------------------------------

            var member = await query
                .AsNoTracking()
                .Where(m =>
                    m.MemberId == memberId.Value)
                .Select(m =>
                    ToMemberResponseQuery(m))
                .FirstOrDefaultAsync();

            // -----------------------------------------------------
            // NOT FOUND
            // -----------------------------------------------------

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER PROFILE NOT FOUND.",

                    memberId =
                        memberId.Value
                });
            }

            return Ok(member);
        }

        // =========================================================
        // GET MEMBER BY ID
        // GET: /api/Members/{id}
        // Permission: Members / view
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMember(int id)
        {
            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            return Ok(BuildMemberResponse(member));
        }

        // =========================================================
        // SEARCH MEMBERS
        // GET: /api/Members/search?name=April
        // Permission: Members / view
        // =========================================================

        [HttpGet("search")]
        [Permission("Members", "view")]
        public async Task<IActionResult> SearchMembers(
            [FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message =
                        "PLEASE ENTER A NAME TO SEARCH."
                });
            }

            var query = GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var keyword = name.Trim();

            query = query.Where(m =>
                m.Status != null &&
                m.Status.ToLower() == "active" &&
                (
                    (m.FirstName != null &&
                     m.FirstName.ToLower().Contains(keyword.ToLower()))

                    ||

                    (m.MiddleName != null &&
                     m.MiddleName.ToLower().Contains(keyword.ToLower()))

                    ||

                    (m.LastName != null &&
                     m.LastName.ToLower().Contains(keyword.ToLower()))

                    ||

                    (
                        m.FirstName + " " +
                        m.MiddleName + " " +
                        m.LastName
                    )
                    .ToLower()
                    .Contains(keyword.ToLower())

                    ||

                    (m.MemberCode != null &&
                     m.MemberCode.ToLower().Contains(keyword.ToLower()))
                ));

            var members = await query
                .AsNoTracking()
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .Select(m => new
                {
                    memberId = m.MemberId,
                    customerId = m.CustomerId,
                    memberCode = m.MemberCode,

                    fullName =
                        (m.FirstName + " " +
                         m.MiddleName + " " +
                         m.LastName).Trim(),

                    ministry = m.Ministry,
                    contactNumber = m.ContactNumber,
                    status = m.Status,
                    photoPath = m.PhotoPath
                })
                .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // COMPLETE MEMBER PROFILE
        // GET: /api/Members/{id}/profile
        // Permission: Members / view
        // =========================================================

        [HttpGet("{id:int}/profile")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMemberProfile(int id)
        {
            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            // -----------------------------------------------------
            // ATTENDANCE
            // -----------------------------------------------------

            var attendance = await _context.Attendances
                .AsNoTracking()
                .Where(a => a.MemberId == id)
                .OrderByDescending(a => a.AttendanceDate)
                .ThenByDescending(a => a.AttendanceId)
                .Select(a => new
                {
                    attendanceId = a.AttendanceId,
                    attendanceDate = a.AttendanceDate,

                    service =
                        !string.IsNullOrWhiteSpace(a.Service)
                            ? a.Service
                            : a.ChurchService != null
                                ? a.ChurchService.ServiceName
                                : "—",

                    status = a.Status,
                    recordedBy = a.RecordedBy,
                    recordedDate = a.RecordedDate
                })
                .ToListAsync();

            // -----------------------------------------------------
            // ATTENDANCE SUMMARY
            // -----------------------------------------------------

            var totalRecords = attendance.Count;

            var present = CountStatus(
                attendance,
                "PRESENT");

            var late = CountStatus(
                attendance,
                "LATE");

            var early = CountStatus(
                attendance,
                "EARLY");

            var absent = CountStatus(
                attendance,
                "ABSENT");

            var excused = CountStatus(
                attendance,
                "EXCUSED");

            var attendedRecords =
                present +
                late +
                early;

            var attendanceRate =
                totalRecords > 0
                    ? Math.Round(
                        attendedRecords /
                        (decimal)totalRecords *
                        100m,
                        2)
                    : 0m;

            // -----------------------------------------------------
            // MINISTRY ASSIGNMENTS
            // -----------------------------------------------------

            var ministries =
                await _context.MinistryMembers
                    .AsNoTracking()
                    .Where(mm => mm.MemberId == id)
                    .OrderByDescending(mm => mm.DateAssigned)
                    .Select(mm => new
                    {
                        ministryMemberId =
                            mm.MinistryMemberId,

                        ministryId =
                            mm.MinistryId,

                        ministryName =
                            mm.Ministry != null
                                ? mm.Ministry.Name
                                : "—",

                        role =
                            !string.IsNullOrWhiteSpace(mm.Role)
                                ? mm.Role
                                : mm.Position,

                        status = mm.Status,

                        dateAssigned = mm.DateAssigned
                    })
                    .ToListAsync();

            // -----------------------------------------------------
            // VISITOR CONVERSION
            // -----------------------------------------------------

            var visitorConversion =
                await _context.Visitors
                    .AsNoTracking()
                    .Where(v =>
                        v.ConvertedMemberId == id ||
                        (
                            v.IsConvertedToMember &&
                            v.FirstName == member.FirstName &&
                            v.LastName == member.LastName
                        ))
                    .OrderByDescending(v => v.ConversionDate)
                    .Select(v => new
                    {
                        visitorId = v.VisitorId,
                        visitorCode = v.VisitorCode,
                        firstVisitDate = v.FirstVisitDate,
                        visitCount = v.VisitCount,
                        followUpStatus = v.FollowUpStatus,
                        conversionDate = v.ConversionDate,
                        status = v.Status
                    })
                    .FirstOrDefaultAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                member = BuildMemberResponse(member),

                attendanceSummary = new
                {
                    totalRecords,
                    present,
                    late,
                    early,
                    absent,
                    excused,
                    attendanceRate
                },

                attendanceHistory = attendance,

                ministries,

                visitorConversion
            });
        }

        // =========================================================
        // CREATE MEMBER
        // POST: /api/Members
        // Permission: Members / create
        // =========================================================

        [HttpPost]
        [Permission("Members", "create")]
        public async Task<IActionResult> CreateMember(
            [FromBody] Member member)
        {
            if (member == null)
            {
                return BadRequest(new
                {
                    message = "MEMBER DATA IS REQUIRED."
                });
            }

            var validation = ValidateMember(member);

            if (validation != null)
            {
                return validation;
            }

            // -----------------------------------------------------
            // RESOLVE CUSTOMER / TENANT
            // -----------------------------------------------------

            var customerId =
                await ResolveCustomerIdForWrite(
                    member.CustomerId);

            if (!customerId.HasValue)
            {
                return CustomerIdUnauthorized();
            }

            member.CustomerId = customerId.Value;

            // -----------------------------------------------------
            // CLEAN DATA
            // -----------------------------------------------------

            CleanMember(member);

            // -----------------------------------------------------
            // MEMBER CODE
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(member.MemberCode))
            {
                member.MemberCode =
                    await GenerateMemberCode(
                        member.CustomerId);
            }
            else
            {
                var codeExists =
                    await MemberCodeExistsAsync(
                        member.CustomerId,
                        member.MemberCode);

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS FOR THIS CUSTOMER.",

                        memberCode =
                            member.MemberCode,

                        customerId =
                            member.CustomerId
                    });
                }
            }

            // -----------------------------------------------------
            // DATES
            // -----------------------------------------------------

            member.CreatedDate = DateTime.UtcNow;
            member.UpdatedDate = null;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMember),
                new
                {
                    id = member.MemberId
                },
                new
                {
                    message =
                        "MEMBER ADDED SUCCESSFULLY.",

                    member =
                        BuildMemberResponse(member)
                });
        }

        // =========================================================
        // UPDATE MEMBER
        // PUT: /api/Members/{id}
        // Permission: Members / edit
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Members", "edit")]
        public async Task<IActionResult> UpdateMember(
            int id,
            [FromBody] Member updatedMember)
        {
            if (updatedMember == null)
            {
                return BadRequest(new
                {
                    message = "MEMBER DATA IS REQUIRED."
                });
            }

            var validation = ValidateMember(updatedMember);

            if (validation != null)
            {
                return validation;
            }

            // -----------------------------------------------------
            // GET EXISTING TENANT-SCOPED MEMBER
            // -----------------------------------------------------

            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            // -----------------------------------------------------
            // CLEAN INPUT
            // -----------------------------------------------------

            CleanMember(updatedMember);

            // -----------------------------------------------------
            // MEMBER CODE
            // -----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(
                updatedMember.MemberCode))
            {
                var codeExists =
                    await _context.Members
                        .AsNoTracking()
                        .AnyAsync(m =>
                            m.MemberId != id &&
                            m.CustomerId == member.CustomerId &&
                            m.MemberCode ==
                                updatedMember.MemberCode);

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS FOR THIS CUSTOMER.",

                        memberCode =
                            updatedMember.MemberCode
                    });
                }

                member.MemberCode =
                    updatedMember.MemberCode;
            }

            // -----------------------------------------------------
            // NEVER CHANGE CUSTOMER ID
            // -----------------------------------------------------

            member.FirstName =
                updatedMember.FirstName;

            member.MiddleName =
                updatedMember.MiddleName;

            member.LastName =
                updatedMember.LastName;

            member.Gender =
                updatedMember.Gender;

            member.BirthDate =
                updatedMember.BirthDate;

            member.ContactNumber =
                updatedMember.ContactNumber;

            member.Address =
                updatedMember.Address;

            member.CivilStatus =
                updatedMember.CivilStatus;

            member.Ministry =
                updatedMember.Ministry;

            member.DateJoined =
                updatedMember.DateJoined;

            if (!string.IsNullOrWhiteSpace(
                updatedMember.Status))
            {
                member.Status =
                    updatedMember.Status;
            }

            if (!string.IsNullOrWhiteSpace(
                updatedMember.PhotoPath))
            {
                member.PhotoPath =
                    updatedMember.PhotoPath;
            }

            member.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER UPDATED SUCCESSFULLY.",

                member =
                    BuildMemberResponse(member)
            });
        }

        // =========================================================
        // UPDATE MEMBER PHOTO
        // PUT: /api/Members/{id}/photo
        // Permission: Members / edit
        // =========================================================

        [HttpPut("{id:int}/photo")]
        [Permission("Members", "edit")]
        [RequestSizeLimit(MaxPhotoSize)]
        public async Task<IActionResult> UpdateMemberPhoto(
            int id,
            IFormFile photo)
        {
            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            if (photo == null || photo.Length == 0)
            {
                return BadRequest(new
                {
                    message = "PHOTO IS REQUIRED."
                });
            }

            if (photo.Length > MaxPhotoSize)
            {
                return BadRequest(new
                {
                    message =
                        "PHOTO SIZE MUST NOT EXCEED 10 MB."
                });
            }

            var extension =
                Path.GetExtension(photo.FileName)
                    .ToLowerInvariant();

            if (!AllowedPhotoExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message =
                        "ONLY JPG, JPEG, PNG, AND WEBP PHOTOS ARE ALLOWED."
                });
            }

            // -----------------------------------------------------
            // DELETE OLD PHOTO
            // -----------------------------------------------------

            DeleteExistingPhoto(member.PhotoPath);

            // -----------------------------------------------------
            // CREATE SAFE FILE NAME
            // -----------------------------------------------------

            var safeCode =
                string.IsNullOrWhiteSpace(member.MemberCode)
                    ? $"MEM-{member.MemberId:0000}"
                    : member.MemberCode;

            safeCode = SanitizeFileName(safeCode);

            var fileName =
                $"{safeCode}-{Guid.NewGuid():N}{extension}";

            var filePath =
                Path.Combine(
                    _photoFolder,
                    fileName);

            // -----------------------------------------------------
            // SAVE FILE
            // -----------------------------------------------------

            await using var stream =
                new FileStream(
                    filePath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None);

            await photo.CopyToAsync(stream);

            // -----------------------------------------------------
            // UPDATE DATABASE
            // -----------------------------------------------------

            member.PhotoPath =
                $"/member-photos/{fileName}";

            member.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER PHOTO UPDATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                customerId =
                    member.CustomerId,

                photoPath =
                    member.PhotoPath
            });
        }

        // =========================================================
        // DELETE MEMBER PHOTO
        // DELETE: /api/Members/{id}/photo
        // Permission: Members / edit
        // =========================================================

        [HttpDelete("{id:int}/photo")]
        [Permission("Members", "edit")]
        public async Task<IActionResult> DeleteMemberPhoto(
            int id)
        {
            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            DeleteExistingPhoto(member.PhotoPath);

            member.PhotoPath = "";
            member.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER PHOTO REMOVED.",

                memberId =
                    member.MemberId,

                customerId =
                    member.CustomerId
            });
        }

        // =========================================================
        // DEACTIVATE MEMBER
        // DELETE: /api/Members/{id}
        // Permission: Members / delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Members", "delete")]
        public async Task<IActionResult> DeactivateMember(
            int id)
        {
            var member = await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            member.Status = "INACTIVE";
            member.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER DEACTIVATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                customerId =
                    member.CustomerId,

                memberCode =
                    member.MemberCode,

                status =
                    member.Status
            });
        }

        // =========================================================
        // TENANT-SCOPED MEMBER QUERY
        // =========================================================

        private IQueryable<Member>? GetTenantMembersQuery()
        {
            var query =
                _context.Members.AsQueryable();

            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            if (IsCurrentUserAdmin())
            {
                return query;
            }

            // -----------------------------------------------------
            // NON-ADMIN
            // -----------------------------------------------------

            var customerId =
                GetCurrentCustomerId();

            if (!customerId.HasValue)
            {
                return null;
            }

            return query.Where(m =>
                m.CustomerId == customerId.Value);
        }

        // =========================================================
        // FIND TENANT MEMBER
        // =========================================================

        private async Task<Member?> FindTenantMemberAsync(
            int memberId)
        {
            var query = GetTenantMembersQuery();

            if (query == null)
            {
                return null;
            }

            return await query
                .FirstOrDefaultAsync(
                    m => m.MemberId == memberId);
        }

        // =========================================================
        // RESOLVE CUSTOMER FOR CREATE
        // =========================================================

        private async Task<int?>
            ResolveCustomerIdForWrite(
                int suppliedCustomerId)
        {
            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            if (IsCurrentUserAdmin())
            {
                if (suppliedCustomerId <= 0)
                {
                    return null;
                }

                var exists =
                    await _context.Customers
                        .AsNoTracking()
                        .AnyAsync(c =>
                            c.CustomerId ==
                            suppliedCustomerId);

                return exists
                    ? suppliedCustomerId
                    : null;
            }

            // -----------------------------------------------------
            // NON-ADMIN
            // NEVER TRUST CUSTOMER ID FROM CLIENT
            // -----------------------------------------------------

            return GetCurrentCustomerId();
        }

        // =========================================================
        // VALIDATE MEMBER
        // =========================================================

        private static BadRequestObjectResult?
            ValidateMember(Member member)
        {
            if (string.IsNullOrWhiteSpace(
                member.FirstName))
            {
                return new BadRequestObjectResult(new
                {
                    message =
                        "FIRST NAME IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(
                member.LastName))
            {
                return new BadRequestObjectResult(new
                {
                    message =
                        "LAST NAME IS REQUIRED."
                });
            }

            return null;
        }

        // =========================================================
        // MEMBER CODE EXISTS
        // =========================================================

        private async Task<bool> MemberCodeExistsAsync(
            int customerId,
            string memberCode)
        {
            return await _context.Members
                .AsNoTracking()
                .AnyAsync(m =>
                    m.CustomerId == customerId &&
                    m.MemberCode == memberCode);
        }

        // =========================================================
        // MEMBER QUERY PROJECTION
        // =========================================================

        private static object ToMemberResponseQuery(
            Member member)
        {
            return new
            {
                memberId = member.MemberId,
                customerId = member.CustomerId,

                memberCode = member.MemberCode,

                firstName = member.FirstName,
                middleName = member.MiddleName,
                lastName = member.LastName,

                fullName =
                    (member.FirstName + " " +
                     member.MiddleName + " " +
                     member.LastName).Trim(),

                gender = member.Gender,
                birthDate = member.BirthDate,

                contactNumber = member.ContactNumber,
                address = member.Address,

                civilStatus = member.CivilStatus,
                ministry = member.Ministry,

                dateJoined = member.DateJoined,
                status = member.Status,
                photoPath = member.PhotoPath,

                createdDate = member.CreatedDate,
                updatedDate = member.UpdatedDate
            };
        }

        // =========================================================
        // BUILD MEMBER RESPONSE
        // =========================================================

        private static object BuildMemberResponse(
            Member member)
        {
            return new
            {
                memberId = member.MemberId,
                customerId = member.CustomerId,

                memberCode = member.MemberCode,

                firstName = member.FirstName,
                middleName = member.MiddleName,
                lastName = member.LastName,

                fullName =
                    BuildFullName(
                        member.FirstName,
                        member.MiddleName,
                        member.LastName),

                gender = member.Gender,
                birthDate = member.BirthDate,

                contactNumber = member.ContactNumber,
                address = member.Address,

                civilStatus = member.CivilStatus,
                ministry = member.Ministry,

                dateJoined = member.DateJoined,
                status = member.Status,
                photoPath = member.PhotoPath,

                createdDate = member.CreatedDate,
                updatedDate = member.UpdatedDate
            };
        }

        // =========================================================
        // BUILD FULL NAME
        // =========================================================

        private static string BuildFullName(
            string? firstName,
            string? middleName,
            string? lastName)
        {
            return string.Join(
                " ",
                new[]
                {
                    firstName,
                    middleName,
                    lastName
                }
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x)))
                .Trim();
        }

        // =========================================================
        // COUNT ATTENDANCE STATUS
        // =========================================================

        private static int CountStatus<T>(
            IEnumerable<T> records,
            string status)
            where T : class
        {
            var property =
                typeof(T).GetProperty("status");

            if (property == null)
            {
                return 0;
            }

            return records.Count(record =>
                string.Equals(
                    property.GetValue(record)?.ToString(),
                    status,
                    StringComparison.OrdinalIgnoreCase));
        }

        // =========================================================
        // GET CUSTOMER ID FROM JWT
        // =========================================================

        private int? GetCurrentCustomerId()
        {
            var claim =
                User.FindFirst("CustomerId")?.Value
                ??
                User.FindFirst("customerId")?.Value
                ??
                User.FindFirst("customer_id")?.Value;

            return int.TryParse(
                    claim,
                    out var customerId) &&
                customerId > 0
                    ? customerId
                    : null;
        }

        // =========================================================
        // GET MEMBER ID FROM JWT
        // =========================================================

        private int? GetCurrentMemberId()
        {
            var claim =
                User.FindFirst("MemberId")?.Value
                ??
                User.FindFirst("memberId")?.Value
                ??
                User.FindFirst("member_id")?.Value;

            return int.TryParse(
                    claim,
                    out var memberId) &&
                memberId > 0
                    ? memberId
                    : null;
        }

        // =========================================================
        // GET CURRENT ROLE
        // =========================================================

        private string GetCurrentRole()
        {
            var role =
                User.FindFirst(
                    ClaimTypes.Role)?.Value
                ??
                User.FindFirst("role")?.Value;

            return role?
                .Trim()
                .ToUpperInvariant()
                ?? "";
        }

        // =========================================================
        // ADMIN CHECK
        // =========================================================

        private bool IsCurrentUserAdmin()
        {
            return string.Equals(
                GetCurrentRole(),
                "ADMIN",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // CUSTOMER ID ERROR
        // =========================================================

        private UnauthorizedObjectResult
            CustomerIdUnauthorized()
        {
            return Unauthorized(new
            {
                message =
                    "CUSTOMER ID CLAIM IS MISSING OR INVALID."
            });
        }

        // =========================================================
        // DELETE EXISTING PHOTO
        // =========================================================

        private void DeleteExistingPhoto(
            string? photoPath)
        {
            if (string.IsNullOrWhiteSpace(photoPath))
            {
                return;
            }

            var fileName =
                Path.GetFileName(photoPath);

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var filePath =
                Path.Combine(
                    _photoFolder,
                    fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return;
            }

            try
            {
                System.IO.File.Delete(filePath);
            }
            catch
            {
                // Do not fail the request
                // if the old photo cannot be deleted.
            }
        }

        // =========================================================
        // SANITIZE FILE NAME
        // =========================================================

        private static string SanitizeFileName(
            string value)
        {
            foreach (var character in
                     Path.GetInvalidFileNameChars())
            {
                value =
                    value.Replace(
                        character,
                        '-');
            }

            return value.Trim();
        }

        // =========================================================
        // CLEAN MEMBER
        // =========================================================

        private static void CleanMember(
            Member member)
        {
            member.MemberCode =
                member.MemberCode?
                    .Trim()
                ?? "";

            member.FirstName =
                member.FirstName?
                    .Trim()
                ?? "";

            member.MiddleName =
                member.MiddleName?
                    .Trim()
                ?? "";

            member.LastName =
                member.LastName?
                    .Trim()
                ?? "";

            member.Gender =
                member.Gender?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.ContactNumber =
                member.ContactNumber?
                    .Trim()
                ?? "";

            member.Address =
                member.Address?
                    .Trim()
                ?? "";

            member.CivilStatus =
                member.CivilStatus?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.Ministry =
                member.Ministry?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.Status =
                string.IsNullOrWhiteSpace(
                    member.Status)
                    ? "ACTIVE"
                    : member.Status
                        .Trim()
                        .ToUpperInvariant();

            member.PhotoPath =
                member.PhotoPath?
                    .Trim()
                ?? "";
        }

        // =========================================================
        // GENERATE MEMBER CODE
        // =========================================================

        private async Task<string>
            GenerateMemberCode(
                int customerId)
        {
            var nextNumber = 1;

            var lastMember =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.CustomerId ==
                        customerId)
                    .OrderByDescending(m =>
                        m.MemberId)
                    .FirstOrDefaultAsync();

            if (lastMember != null)
            {
                nextNumber =
                    lastMember.MemberId + 1;
            }

            while (true)
            {
                var code =
                    $"MEM-{nextNumber:0000}";

                var exists =
                    await _context.Members
                        .AsNoTracking()
                        .AnyAsync(m =>
                            m.CustomerId == customerId &&
                            m.MemberCode == code);

                if (!exists)
                {
                    return code;
                }

                nextNumber++;
            }
        }
    }
}