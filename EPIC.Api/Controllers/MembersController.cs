using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembersController : ControllerBase
    {
        // =========================================================
        // DEPENDENCIES
        // =========================================================

        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly MemberAccountProvisioningService
            _memberAccountProvisioningService;

        private readonly string _photoFolder;

        // =========================================================
        // PHOTO SETTINGS
        // =========================================================

        private static readonly string[] AllowedPhotoExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        private const long MaxPhotoSize =
            10 * 1024 * 1024;

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public MembersController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            MemberAccountProvisioningService memberAccountProvisioningService)
        {
            _context = context;
            _environment = environment;
            _memberAccountProvisioningService =
                memberAccountProvisioningService;

            _photoFolder = Path.Combine(
                _environment.ContentRootPath,
                "root-uploads-members");

            Directory.CreateDirectory(_photoFolder);
        }

        // =========================================================
        // GET ALL MEMBERS
        // GET: /api/Members
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
                .Select(m => new MemberResponseDto
                {
                    MemberId = m.MemberId,
                    CustomerId = m.CustomerId,
                    MemberCode = m.MemberCode,

                    FirstName = m.FirstName ?? "",
                    MiddleName = m.MiddleName ?? "",
                    LastName = m.LastName ?? "",

                    FullName =
                        ((m.FirstName ?? "") + " " +
                         (m.MiddleName ?? "") + " " +
                         (m.LastName ?? "")).Trim(),

                    Gender = m.Gender ?? "",
                    BirthDate = m.BirthDate,

                    ContactNumber = m.ContactNumber ?? "",
                    Address = m.Address ?? "",

                    CivilStatus = m.CivilStatus ?? "",
                    Ministry = m.Ministry ?? "",

                    DateJoined = m.DateJoined,
                    Status = m.Status ?? "",

                    PhotoPath = m.PhotoPath ?? "",

                    CreatedDate = m.CreatedDate,
                    UpdatedDate = m.UpdatedDate
                })
                .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // GET MY MEMBER PROFILE
        // GET: /api/Members/me
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

            var query = GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var member = await query
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.MemberId == memberId.Value);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER PROFILE NOT FOUND.",
                    memberId = memberId.Value
                });
            }

            return Ok(BuildMemberResponse(member));
        }

        // =========================================================
        // GET MEMBER
        // GET: /api/Members/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMember(int id)
        {
            var member =
                await FindTenantMemberAsync(id);

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

            var query =
                GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var keyword =
                name.Trim().ToLower();

            query = query.Where(m =>
                m.Status != null &&
                m.Status.ToLower() == "active" &&
                (
                    (
                        m.FirstName != null &&
                        m.FirstName.ToLower()
                            .Contains(keyword)
                    )
                    ||
                    (
                        m.MiddleName != null &&
                        m.MiddleName.ToLower()
                            .Contains(keyword)
                    )
                    ||
                    (
                        m.LastName != null &&
                        m.LastName.ToLower()
                            .Contains(keyword)
                    )
                    ||
                    (
                        (m.FirstName ?? "") + " " +
                        (m.MiddleName ?? "") + " " +
                        (m.LastName ?? "")
                    )
                    .ToLower()
                    .Contains(keyword)
                    ||
                    (
                        m.MemberCode != null &&
                        m.MemberCode.ToLower()
                            .Contains(keyword)
                    )
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
                        ((m.FirstName ?? "") + " " +
                         (m.MiddleName ?? "") + " " +
                         (m.LastName ?? "")).Trim(),

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
        // =========================================================

        [HttpGet("{id:int}/profile")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMemberProfile(
            int id)
        {
            var member =
                await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            // =====================================================
            // ATTENDANCE
            // =====================================================

            var attendance =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a => a.MemberId == id)
                    .OrderByDescending(
                        a => a.AttendanceDate)
                    .ThenByDescending(
                        a => a.AttendanceId)
                    .Select(a => new
                    {
                        attendanceId =
                            a.AttendanceId,

                        attendanceDate =
                            a.AttendanceDate,

                        service =
                            !string.IsNullOrWhiteSpace(
                                a.Service)
                                ? a.Service
                                : a.ChurchService != null
                                    ? a.ChurchService.ServiceName
                                    : "—",

                        status = a.Status,
                        recordedBy = a.RecordedBy,
                        recordedDate = a.RecordedDate
                    })
                    .ToListAsync();

            // =====================================================
            // ATTENDANCE SUMMARY
            // =====================================================

            var totalRecords =
                attendance.Count;

            var present =
                CountStatus(
                    attendance,
                    "PRESENT");

            var late =
                CountStatus(
                    attendance,
                    "LATE");

            var early =
                CountStatus(
                    attendance,
                    "EARLY");

            var absent =
                CountStatus(
                    attendance,
                    "ABSENT");

            var excused =
                CountStatus(
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

            // =====================================================
            // MINISTRY ASSIGNMENTS
            // =====================================================

            var ministries =
                await _context.MinistryMembers
                    .AsNoTracking()
                    .Where(mm =>
                        mm.MemberId == id)
                    .OrderByDescending(
                        mm => mm.DateAssigned)
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
                            !string.IsNullOrWhiteSpace(
                                mm.Role)
                                ? mm.Role
                                : mm.Position,

                        status = mm.Status,

                        dateAssigned =
                            mm.DateAssigned
                    })
                    .ToListAsync();

            // =====================================================
            // VISITOR CONVERSION
            // =====================================================

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
                    .OrderByDescending(
                        v => v.ConversionDate)
                    .Select(v => new
                    {
                        visitorId =
                            v.VisitorId,

                        visitorCode =
                            v.VisitorCode,

                        firstVisitDate =
                            v.FirstVisitDate,

                        visitCount =
                            v.VisitCount,

                        followUpStatus =
                            v.FollowUpStatus,

                        conversionDate =
                            v.ConversionDate,

                        status =
                            v.Status
                    })
                    .FirstOrDefaultAsync();

            return Ok(new
            {
                member =
                    BuildMemberResponse(member),

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

                attendanceHistory =
                    attendance,

                ministries,

                visitorConversion
            });
        }

        // =========================================================
        // CREATE MEMBER
        // POST: /api/Members
        //
        // IMPORTANT:
        // Creates MEMBER + automatically creates MEMBER account.
        // =========================================================

        [HttpPost]
        [Permission("Members", "create")]
        public async Task<IActionResult> CreateMember(
            [FromBody] CreateMemberDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "MEMBER DATA IS REQUIRED."
                });
            }

            // =====================================================
            // VALIDATION
            // =====================================================

            var firstName =
                dto.FirstName?.Trim();

            var lastName =
                dto.LastName?.Trim();

            if (string.IsNullOrWhiteSpace(firstName))
            {
                return BadRequest(new
                {
                    message =
                        "FIRST NAME IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(lastName))
            {
                return BadRequest(new
                {
                    message =
                        "LAST NAME IS REQUIRED."
                });
            }

            // =====================================================
            // RESOLVE CUSTOMER
            // =====================================================

            var customerId =
                await ResolveCustomerIdForWrite(
                    dto.CustomerId ?? 0);

            if (!customerId.HasValue)
            {
                return CustomerIdUnauthorized();
            }

            // =====================================================
            // MEMBER CODE
            // =====================================================

            string memberCode;

            if (string.IsNullOrWhiteSpace(
                dto.MemberCode))
            {
                memberCode =
                    await GenerateMemberCode(
                        customerId.Value);
            }
            else
            {
                memberCode =
                    dto.MemberCode.Trim();

                var codeExists =
                    await MemberCodeExistsAsync(
                        customerId.Value,
                        memberCode);

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS FOR THIS CUSTOMER.",

                        memberCode,

                        customerId =
                            customerId.Value
                    });
                }
            }

            // =====================================================
            // BUILD MEMBER
            // =====================================================

            var member = new Member
            {
                CustomerId =
                    customerId.Value,

                MemberCode =
                    memberCode,

                FirstName =
                    firstName,

                MiddleName =
                    dto.MiddleName?.Trim()
                    ?? "",

                LastName =
                    lastName,

                Gender =
                    dto.Gender?
                        .Trim()
                        .ToUpperInvariant()
                    ?? "",

                BirthDate =
                    dto.BirthDate,

                ContactNumber =
                    dto.ContactNumber?.Trim()
                    ?? "",

                Address =
                    dto.Address?.Trim()
                    ?? "",

                CivilStatus =
                    dto.CivilStatus?
                        .Trim()
                        .ToUpperInvariant()
                    ?? "",

                Ministry =
                    dto.Ministry?
                        .Trim()
                        .ToUpperInvariant()
                    ?? "",

                DateJoined =
                    dto.DateJoined,

                Status =
                    string.IsNullOrWhiteSpace(dto.Status)
                        ? "ACTIVE"
                        : dto.Status
                            .Trim()
                            .ToUpperInvariant(),

                PhotoPath =
                    "",

                CreatedDate =
                    DateTime.UtcNow,

                UpdatedDate =
                    null
            };

            // =====================================================
            // SAVE MEMBER
            // =====================================================

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            // =====================================================
            // PROVISION MEMBER ACCOUNT
            // =====================================================

            MemberAccountProvisioningResult accountResult;

            try
            {
                accountResult =
                    await _memberAccountProvisioningService
                        .ProvisionMemberAsync(
                            member.MemberId,
                            saveChanges: true);
            }
            catch (Exception ex)
            {
                // Roll back member if account creation
                // throws an unexpected exception.

                _context.Members.Remove(member);

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // Preserve original provisioning error.
                }

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "MEMBER ACCOUNT PROVISIONING FAILED.",

                        error =
                            ex.Message
                    });
            }

            // =====================================================
            // PROVISIONING FAILED
            // =====================================================

            if (!accountResult.Success)
            {
                _context.Members.Remove(member);

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // Ignore rollback exception.
                }

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "MEMBER WAS NOT CREATED BECAUSE THE MEMBER ACCOUNT COULD NOT BE PROVISIONED.",

                        provisioningMessage =
                            accountResult.Message
                    });
            }

            // =====================================================
            // SUCCESS
            // =====================================================

            return CreatedAtAction(
                nameof(GetMember),
                new
                {
                    id = member.MemberId
                },
                new
                {
                    message =
                        "MEMBER AND MEMBER ACCOUNT CREATED SUCCESSFULLY.",

                    member =
                        BuildMemberResponse(member),

                    account =
                        new
                        {
                            userId =
                                accountResult.UserId,

                            username =
                                accountResult.Username,

                            temporaryPassword =
                                accountResult.TemporaryPassword,

                            memberId =
                                accountResult.MemberId,

                            customerId =
                                accountResult.CustomerId,

                            memberCode =
                                accountResult.MemberCode,

                            fullName =
                                accountResult.FullName,

                            accountType =
                                "MEMBER",

                            approvalStatus =
                                "APPROVED",

                            isActive =
                                true
                        }
                });
        }

        // =========================================================
        // UPDATE MEMBER
        // PUT: /api/Members/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Members", "edit")]
        public async Task<IActionResult> UpdateMember(
            int id,
            [FromBody] UpdateMemberDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "MEMBER DATA IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(
                dto.FirstName))
            {
                return BadRequest(new
                {
                    message =
                        "FIRST NAME IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(
                dto.LastName))
            {
                return BadRequest(new
                {
                    message =
                        "LAST NAME IS REQUIRED."
                });
            }

            var member =
                await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER NOT FOUND.",

                    memberId =
                        id
                });
            }

            // =====================================================
            // MEMBER CODE
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                dto.MemberCode))
            {
                var newMemberCode =
                    dto.MemberCode.Trim();

                var codeExists =
                    await _context.Members
                        .AsNoTracking()
                        .AnyAsync(m =>
                            m.MemberId != id &&
                            m.CustomerId ==
                                member.CustomerId &&
                            m.MemberCode ==
                                newMemberCode);

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS FOR THIS CUSTOMER.",

                        memberCode =
                            newMemberCode
                    });
                }

                member.MemberCode =
                    newMemberCode;
            }

            // =====================================================
            // PERSONAL INFORMATION
            // =====================================================

            member.FirstName =
                dto.FirstName.Trim();

            member.MiddleName =
                dto.MiddleName?.Trim()
                ?? "";

            member.LastName =
                dto.LastName.Trim();

            member.Gender =
                dto.Gender?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.BirthDate =
                dto.BirthDate;

            // =====================================================
            // CONTACT
            // =====================================================

            member.ContactNumber =
                dto.ContactNumber?.Trim()
                ?? "";

            member.Address =
                dto.Address?.Trim()
                ?? "";

            // =====================================================
            // MEMBER INFORMATION
            // =====================================================

            member.CivilStatus =
                dto.CivilStatus?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.Ministry =
                dto.Ministry?
                    .Trim()
                    .ToUpperInvariant()
                ?? "";

            member.DateJoined =
                dto.DateJoined;

            // =====================================================
            // STATUS
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                dto.Status))
            {
                member.Status =
                    dto.Status
                        .Trim()
                        .ToUpperInvariant();
            }

            // =====================================================
            // PHOTO PATH
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                dto.PhotoPath))
            {
                member.PhotoPath =
                    dto.PhotoPath.Trim();
            }

            // =====================================================
            // AUDIT
            // =====================================================

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
        // =========================================================

        [HttpPut("{id:int}/photo")]
        [Permission("Members", "edit")]
        [RequestSizeLimit(MaxPhotoSize)]
        public async Task<IActionResult> UpdateMemberPhoto(
            int id,
            IFormFile photo)
        {
            var member =
                await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER NOT FOUND.",

                    memberId =
                        id
                });
            }

            if (photo == null ||
                photo.Length == 0)
            {
                return BadRequest(new
                {
                    message =
                        "PHOTO IS REQUIRED."
                });
            }

            if (photo.Length >
                MaxPhotoSize)
            {
                return BadRequest(new
                {
                    message =
                        "PHOTO SIZE MUST NOT EXCEED 10 MB."
                });
            }

            var extension =
                Path.GetExtension(
                    photo.FileName)
                    .ToLowerInvariant();

            if (!AllowedPhotoExtensions.Contains(
                extension))
            {
                return BadRequest(new
                {
                    message =
                        "ONLY JPG, JPEG, PNG, AND WEBP PHOTOS ARE ALLOWED."
                });
            }

            // =====================================================
            // DELETE OLD PHOTO
            // =====================================================

            DeleteExistingPhoto(
                member.PhotoPath);

            // =====================================================
            // SAFE FILE NAME
            // =====================================================

            var safeCode =
                string.IsNullOrWhiteSpace(
                    member.MemberCode)
                    ? $"MEM-{member.MemberId:0000}"
                    : member.MemberCode;

            safeCode =
                SanitizeFileName(
                    safeCode);

            var fileName =
                $"{safeCode}-{Guid.NewGuid():N}{extension}";

            var filePath =
                Path.Combine(
                    _photoFolder,
                    fileName);

            // =====================================================
            // SAVE FILE
            // =====================================================

            await using var stream =
                new FileStream(
                    filePath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None);

            await photo.CopyToAsync(stream);

            // =====================================================
            // DATABASE
            // =====================================================

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
        // =========================================================

        [HttpDelete("{id:int}/photo")]
        [Permission("Members", "edit")]
        public async Task<IActionResult> DeleteMemberPhoto(
            int id)
        {
            var member =
                await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER NOT FOUND.",

                    memberId =
                        id
                });
            }

            DeleteExistingPhoto(
                member.PhotoPath);

            member.PhotoPath =
                "";

            member.UpdatedDate =
                DateTime.UtcNow;

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
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Members", "delete")]
        public async Task<IActionResult> DeactivateMember(
            int id)
        {
            var member =
                await FindTenantMemberAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER NOT FOUND.",

                    memberId =
                        id
                });
            }

            member.Status =
                "INACTIVE";

            member.UpdatedDate =
                DateTime.UtcNow;

            // Also deactivate the member login account.
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u => u.MemberId == id);

            if (user != null)
            {
                user.IsActive = false;
                user.UpdatedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER AND MEMBER ACCOUNT DEACTIVATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                customerId =
                    member.CustomerId,

                memberCode =
                    member.MemberCode,

                status =
                    member.Status,

                accountDeactivated =
                    user != null
            });
        }

        // =========================================================
        // TENANT-SCOPED MEMBER QUERY
        // =========================================================

        private IQueryable<Member>?
            GetTenantMembersQuery()
        {
            var query =
                _context.Members.AsQueryable();

            // =====================================================
            // ADMIN
            // =====================================================

            if (IsCurrentUserAdmin())
            {
                return query;
            }

            // =====================================================
            // CLIENT / MEMBER
            // =====================================================

            var customerId =
                GetCurrentCustomerId();

            if (!customerId.HasValue)
            {
                return null;
            }

            return query.Where(
                m => m.CustomerId ==
                    customerId.Value);
        }

        // =========================================================
        // FIND TENANT MEMBER
        // =========================================================

        private async Task<Member?>
            FindTenantMemberAsync(
                int memberId)
        {
            var query =
                GetTenantMembersQuery();

            if (query == null)
            {
                return null;
            }

            return await query
                .FirstOrDefaultAsync(
                    m => m.MemberId ==
                        memberId);
        }

        // =========================================================
        // RESOLVE CUSTOMER ID
        // =========================================================

        private async Task<int?>
            ResolveCustomerIdForWrite(
                int suppliedCustomerId)
        {
            // =====================================================
            // ADMIN
            // =====================================================

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

            // =====================================================
            // NON-ADMIN
            //
            // NEVER TRUST CUSTOMER ID FROM FRONTEND
            // =====================================================

            return GetCurrentCustomerId();
        }

        // =========================================================
        // MEMBER CODE EXISTS
        // =========================================================

        private async Task<bool>
            MemberCodeExistsAsync(
                int customerId,
                string memberCode)
        {
            return await _context.Members
                .AsNoTracking()
                .AnyAsync(m =>
                    m.CustomerId ==
                        customerId &&
                    m.MemberCode ==
                        memberCode);
        }

        // =========================================================
        // BUILD MEMBER RESPONSE
        // =========================================================

        private static MemberResponseDto
            BuildMemberResponse(
                Member member)
        {
            return new MemberResponseDto
            {
                MemberId =
                    member.MemberId,

                CustomerId =
                    member.CustomerId,

                MemberCode =
                    member.MemberCode ?? "",

                FirstName =
                    member.FirstName ?? "",

                MiddleName =
                    member.MiddleName ?? "",

                LastName =
                    member.LastName ?? "",

                FullName =
                    BuildFullName(
                        member.FirstName,
                        member.MiddleName,
                        member.LastName),

                Gender =
                    member.Gender ?? "",

                BirthDate =
                    member.BirthDate,

                ContactNumber =
                    member.ContactNumber ?? "",

                Address =
                    member.Address ?? "",

                CivilStatus =
                    member.CivilStatus ?? "",

                Ministry =
                    member.Ministry ?? "",

                DateJoined =
                    member.DateJoined,

                Status =
                    member.Status ?? "",

                PhotoPath =
                    member.PhotoPath ?? "",

                CreatedDate =
                    member.CreatedDate,

                UpdatedDate =
                    member.UpdatedDate
            };
        }

        // =========================================================
        // BUILD FULL NAME
        // =========================================================

        private static string
            BuildFullName(
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
        {
            var property =
                typeof(T).GetProperty("status");

            if (property == null)
            {
                return 0;
            }

            return records.Count(record =>
                string.Equals(
                    property.GetValue(record)
                        ?.ToString(),
                    status,
                    StringComparison
                        .OrdinalIgnoreCase));
        }

        // =========================================================
        // GET CUSTOMER ID FROM JWT
        // =========================================================

        private int? GetCurrentCustomerId()
        {
            var claim =
                User.FindFirst("CustomerId")
                    ?.Value
                ??
                User.FindFirst("customerId")
                    ?.Value
                ??
                User.FindFirst("customer_id")
                    ?.Value;

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
                User.FindFirst("MemberId")
                    ?.Value
                ??
                User.FindFirst("memberId")
                    ?.Value
                ??
                User.FindFirst("member_id")
                    ?.Value;

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
                User.FindFirst(
                    "role")?.Value;

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
                StringComparison
                    .OrdinalIgnoreCase);
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
            if (string.IsNullOrWhiteSpace(
                photoPath))
            {
                return;
            }

            var fileName =
                Path.GetFileName(
                    photoPath);

            if (string.IsNullOrWhiteSpace(
                fileName))
            {
                return;
            }

            var filePath =
                Path.Combine(
                    _photoFolder,
                    fileName);

            if (!System.IO.File.Exists(
                filePath))
            {
                return;
            }

            try
            {
                System.IO.File.Delete(
                    filePath);
            }
            catch
            {
                // Do not fail request
                // because old photo could not
                // be deleted.
            }
        }

        // =========================================================
        // SANITIZE FILE NAME
        // =========================================================

        private static string
            SanitizeFileName(
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
                    .OrderByDescending(
                        m => m.MemberId)
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
                            m.CustomerId ==
                                customerId &&
                            m.MemberCode ==
                                code);

                if (!exists)
                {
                    return code;
                }

                nextNumber++;
            }
        }
    }

    // =============================================================
    // CREATE MEMBER DTO
    // =============================================================

    public class CreateMemberDto
    {
        public int? CustomerId { get; set; }

        public string? MemberCode { get; set; }

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
    // UPDATE MEMBER DTO
    // =============================================================

    public class UpdateMemberDto
    {
        public string? MemberCode { get; set; }

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

        public string? PhotoPath { get; set; }
    }

    // =============================================================
    // MEMBER RESPONSE DTO
    // =============================================================

    public class MemberResponseDto
    {
        public int MemberId { get; set; }

        public int CustomerId { get; set; }

        public string MemberCode { get; set; } = "";

        public string FirstName { get; set; } = "";

        public string MiddleName { get; set; } = "";

        public string LastName { get; set; } = "";

        public string FullName { get; set; } = "";

        public string Gender { get; set; } = "";

        public DateTime? BirthDate { get; set; }

        public string ContactNumber { get; set; } = "";

        public string Address { get; set; } = "";

        public string CivilStatus { get; set; } = "";

        public string Ministry { get; set; } = "";

        public DateTime? DateJoined { get; set; }

        public string Status { get; set; } = "";

        public string PhotoPath { get; set; } = "";

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}