using EPIC.Api.Authorization;
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
    public class MembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly string _photoFolder;

        public MembersController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;

            _photoFolder = Path.Combine(
                _environment.ContentRootPath,
                "root-uploads-members"
            );

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
            var members = await _context.Members
                .AsNoTracking()
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .Select(m => new
                {
                    memberId = m.MemberId,
                    memberCode = m.MemberCode,

                    firstName = m.FirstName,
                    middleName = m.MiddleName,
                    lastName = m.LastName,

                    fullName =
                        (m.FirstName + " " +
                         m.MiddleName + " " +
                         m.LastName).Trim(),

                    gender = m.Gender,
                    birthDate = m.BirthDate,

                    contactNumber = m.ContactNumber,
                    address = m.Address,
                    civilStatus = m.CivilStatus,
                    ministry = m.Ministry,
                    dateJoined = m.DateJoined,
                    status = m.Status,
                    photoPath = m.PhotoPath,

                    createdDate = m.CreatedDate,
                    updatedDate = m.UpdatedDate
                })
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
            var memberIdClaim =
                User.FindFirst("MemberId")?.Value
                ?? User.FindFirst("memberId")?.Value
                ?? User.FindFirst("member_id")?.Value;

            if (!int.TryParse(
                memberIdClaim,
                out int memberId))
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ID WAS NOT FOUND IN AUTHENTICATION TOKEN."
                });
            }

            var member = await _context.Members
                .AsNoTracking()
                .Where(m => m.MemberId == memberId)
                .Select(m => new
                {
                    memberId = m.MemberId,
                    memberCode = m.MemberCode,

                    firstName = m.FirstName,
                    middleName = m.MiddleName,
                    lastName = m.LastName,

                    fullName =
                        (m.FirstName + " " +
                         m.MiddleName + " " +
                         m.LastName).Trim(),

                    gender = m.Gender,
                    birthDate = m.BirthDate,

                    contactNumber = m.ContactNumber,
                    address = m.Address,

                    civilStatus = m.CivilStatus,
                    ministry = m.Ministry,

                    dateJoined = m.DateJoined,
                    status = m.Status,

                    photoPath = m.PhotoPath,

                    createdDate = m.CreatedDate,
                    updatedDate = m.UpdatedDate
                })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER PROFILE NOT FOUND.",
                    memberId
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
            var member = await _context.Members
                .AsNoTracking()
                .Where(m => m.MemberId == id)
                .Select(m => new
                {
                    memberId = m.MemberId,
                    memberCode = m.MemberCode,

                    firstName = m.FirstName,
                    middleName = m.MiddleName,
                    lastName = m.LastName,

                    fullName =
                        (m.FirstName + " " +
                         m.MiddleName + " " +
                         m.LastName).Trim(),

                    gender = m.Gender,
                    birthDate = m.BirthDate,

                    contactNumber = m.ContactNumber,
                    address = m.Address,
                    civilStatus = m.CivilStatus,
                    ministry = m.Ministry,
                    dateJoined = m.DateJoined,
                    status = m.Status,
                    photoPath = m.PhotoPath,

                    createdDate = m.CreatedDate,
                    updatedDate = m.UpdatedDate
                })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            return Ok(member);
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
                return BadRequest(
                    "PLEASE ENTER A NAME TO SEARCH."
                );
            }

            string keyword =
                name.Trim().ToLower();

            var members = await _context.Members
                .AsNoTracking()
                .Where(m =>
                    m.Status == "ACTIVE" &&
                    (
                        m.FirstName.ToLower().Contains(keyword)
                        ||
                        m.MiddleName.ToLower().Contains(keyword)
                        ||
                        m.LastName.ToLower().Contains(keyword)
                        ||
                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        )
                        .ToLower()
                        .Contains(keyword)
                        ||
                        m.MemberCode.ToLower().Contains(keyword)
                    )
                )
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .Select(m => new
                {
                    memberId = m.MemberId,
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
        //
        // GET:
        // /api/Members/{id}/profile
        //
        // Returns:
        // member
        // attendanceSummary
        // attendanceHistory
        // ministries
        // visitorConversion
        //
        // Permission: Members / view
        // =========================================================

        [HttpGet("{id:int}/profile")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMemberProfile(int id)
        {
            // =====================================================
            // MEMBER
            // =====================================================

            var member = await _context.Members
                .AsNoTracking()
                .Where(m => m.MemberId == id)
                .Select(m => new
                {
                    memberId = m.MemberId,
                    memberCode = m.MemberCode,

                    firstName = m.FirstName,
                    middleName = m.MiddleName,
                    lastName = m.LastName,

                    fullName =
                        (m.FirstName + " " +
                         m.MiddleName + " " +
                         m.LastName).Trim(),

                    gender = m.Gender,
                    birthDate = m.BirthDate,

                    contactNumber = m.ContactNumber,
                    address = m.Address,

                    civilStatus = m.CivilStatus,
                    ministry = m.Ministry,

                    dateJoined = m.DateJoined,
                    status = m.Status,

                    photoPath = m.PhotoPath,

                    createdDate = m.CreatedDate,
                    updatedDate = m.UpdatedDate
                })
                .FirstOrDefaultAsync();

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

            var attendance = await _context.Attendances
                .AsNoTracking()
                .Where(a => a.MemberId == id)
                .OrderByDescending(a => a.AttendanceDate)
                .ThenByDescending(a => a.AttendanceId)
                .Select(a => new
                {
                    attendanceId = a.AttendanceId,

                    attendanceDate =
                        a.AttendanceDate,

                    service =
                        !string.IsNullOrWhiteSpace(a.Service)
                            ? a.Service
                            : a.ChurchService != null
                                ? a.ChurchService.ServiceName
                                : "—",

                    status =
                        a.Status,

                    recordedBy =
                        a.RecordedBy,

                    recordedDate =
                        a.RecordedDate
                })
                .ToListAsync();

            // =====================================================
            // ATTENDANCE SUMMARY
            // =====================================================

            int totalRecords =
                attendance.Count;

            int present =
                attendance.Count(a =>
                    string.Equals(
                        a.status,
                        "PRESENT",
                        StringComparison.OrdinalIgnoreCase));

            int late =
                attendance.Count(a =>
                    string.Equals(
                        a.status,
                        "LATE",
                        StringComparison.OrdinalIgnoreCase));

            int early =
                attendance.Count(a =>
                    string.Equals(
                        a.status,
                        "EARLY",
                        StringComparison.OrdinalIgnoreCase));

            int absent =
                attendance.Count(a =>
                    string.Equals(
                        a.status,
                        "ABSENT",
                        StringComparison.OrdinalIgnoreCase));

            int excused =
                attendance.Count(a =>
                    string.Equals(
                        a.status,
                        "EXCUSED",
                        StringComparison.OrdinalIgnoreCase));

            // =====================================================
            // ATTENDANCE RATE
            //
            // Present + Late + Early are counted as attended.
            // Absent + Excused are not counted as attendance.
            // =====================================================

            int attendedRecords =
                present + late + early;

            decimal attendanceRate =
                totalRecords > 0
                    ? Math.Round(
                        (decimal)attendedRecords /
                        totalRecords *
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
                            !string.IsNullOrWhiteSpace(mm.Role)
                                ? mm.Role
                                : mm.Position,

                        status =
                            mm.Status,

                        dateAssigned =
                            mm.DateAssigned
                    })
                    .ToListAsync();

            // =====================================================
            // VISITOR CONVERSION
            // =====================================================
            //
            // A visitor is connected to the member through:
            // Visitor.ConvertedMemberId
            //

            var visitorConversion =
                await _context.Visitors
                    .AsNoTracking()
                    .Where(v =>
                        v.ConvertedMemberId == id ||
                        (
                            v.IsConvertedToMember &&
                            v.FirstName == member.firstName &&
                            v.LastName == member.lastName
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

            // =====================================================
            // COMPLETE RESPONSE
            // =====================================================

            return Ok(new
            {
                member,

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
        // Permission: Members / create
        // =========================================================

        [HttpPost]
        [Permission("Members", "create")]
        public async Task<IActionResult> CreateMember(
            [FromBody] Member member)
        {
            if (member == null)
            {
                return BadRequest(
                    "MEMBER DATA IS REQUIRED."
                );
            }

            if (string.IsNullOrWhiteSpace(
                member.FirstName))
            {
                return BadRequest(
                    "FIRST NAME IS REQUIRED."
                );
            }

            if (string.IsNullOrWhiteSpace(
                member.LastName))
            {
                return BadRequest(
                    "LAST NAME IS REQUIRED."
                );
            }

            // =====================================================
            // CLEAN DATA FIRST
            // =====================================================

            CleanMember(member);

            // =====================================================
            // CHECK MEMBER CODE
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                member.MemberCode))
            {
                bool exists =
                    await _context.Members
                        .AnyAsync(m =>
                            m.MemberCode ==
                            member.MemberCode);

                if (exists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS."
                    });
                }
            }

            // =====================================================
            // GENERATE MEMBER CODE
            // =====================================================

            if (string.IsNullOrWhiteSpace(
                member.MemberCode))
            {
                member.MemberCode =
                    await GenerateMemberCode();
            }

            // =====================================================
            // RECORD DATES
            // =====================================================

            member.CreatedDate =
                DateTime.Now;

            member.UpdatedDate = null;

            // =====================================================
            // SAVE
            // =====================================================

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

                    member = new
                    {
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

                        photoPath =
                            member.PhotoPath,

                        createdDate =
                            member.CreatedDate,

                        updatedDate =
                            member.UpdatedDate
                    }
                }
            );
        }

        // =========================================================
        // UPDATE MEMBER
        //
        // PUT: /api/Members/{id}
        //
        // IMPORTANT:
        // React Members.tsx sends JSON.
        // Therefore this endpoint uses [FromBody].
        //
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
                return BadRequest(
                    "MEMBER DATA IS REQUIRED."
                );
            }

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(
                        m => m.MemberId == id
                    );

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            if (string.IsNullOrWhiteSpace(
                updatedMember.FirstName))
            {
                return BadRequest(
                    "FIRST NAME IS REQUIRED."
                );
            }

            if (string.IsNullOrWhiteSpace(
                updatedMember.LastName))
            {
                return BadRequest(
                    "LAST NAME IS REQUIRED."
                );
            }

            // =====================================================
            // CLEAN INPUT
            // =====================================================

            CleanMember(updatedMember);

            // =====================================================
            // MEMBER CODE
            // =====================================================

            string newCode =
                updatedMember.MemberCode?.Trim() ?? "";

            if (!string.IsNullOrWhiteSpace(
                newCode))
            {
                bool codeExists =
                    await _context.Members
                        .AnyAsync(m =>
                            m.MemberId != id &&
                            m.MemberCode == newCode
                        );

                if (codeExists)
                {
                    return Conflict(new
                    {
                        message =
                            "MEMBER CODE ALREADY EXISTS."
                    });
                }

                member.MemberCode =
                    newCode;
            }
            else
            {
                // Keep existing code if blank
                member.MemberCode =
                    member.MemberCode;
            }

            // =====================================================
            // UPDATE MEMBER INFORMATION
            // =====================================================

            member.FirstName =
                updatedMember.FirstName.Trim();

            member.MiddleName =
                updatedMember.MiddleName?.Trim() ?? "";

            member.LastName =
                updatedMember.LastName.Trim();

            member.Gender =
                updatedMember.Gender?
                    .Trim()
                    .ToUpper() ?? "";

            member.BirthDate =
                updatedMember.BirthDate;

            member.ContactNumber =
                updatedMember.ContactNumber?
                    .Trim() ?? "";

            member.Address =
                updatedMember.Address?
                    .Trim() ?? "";

            member.CivilStatus =
                updatedMember.CivilStatus?
                    .Trim()
                    .ToUpper() ?? "";

            member.Ministry =
                updatedMember.Ministry?
                    .Trim()
                    .ToUpper() ?? "";

            member.DateJoined =
                updatedMember.DateJoined;

            member.Status =
                string.IsNullOrWhiteSpace(
                    updatedMember.Status)
                    ? member.Status
                    : updatedMember.Status
                        .Trim()
                        .ToUpper();

            // =====================================================
            // PHOTO PATH
            //
            // JSON update may preserve an existing path.
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                updatedMember.PhotoPath))
            {
                member.PhotoPath =
                    updatedMember.PhotoPath.Trim();
            }

            // =====================================================
            // UPDATED DATE
            // =====================================================

            member.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER UPDATED SUCCESSFULLY.",

                member = new
                {
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

                    photoPath =
                        member.PhotoPath,

                    createdDate =
                        member.CreatedDate,

                    updatedDate =
                        member.UpdatedDate
                }
            });
        }

        // =========================================================
        // UPDATE MEMBER WITH PHOTO
        //
        // PUT:
        // /api/Members/{id}/photo
        //
        // Permission: Members / edit
        // =========================================================

        [HttpPut("{id:int}/photo")]
        [Permission("Members", "edit")]
        [RequestSizeLimit(10_000_000)]
        public async Task<IActionResult> UpdateMemberPhoto(
            int id,
            IFormFile photo)
        {
            var member =
                await _context.Members
                    .FirstOrDefaultAsync(
                        m => m.MemberId == id
                    );

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            if (photo == null ||
                photo.Length == 0)
            {
                return BadRequest(
                    "PHOTO IS REQUIRED."
                );
            }

            string[] allowedExtensions =
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

            string extension =
                Path.GetExtension(
                    photo.FileName)
                .ToLowerInvariant();

            if (!allowedExtensions.Contains(
                extension))
            {
                return BadRequest(
                    "ONLY JPG, JPEG, PNG, AND WEBP PHOTOS ARE ALLOWED."
                );
            }

            if (photo.Length >
                10 * 1024 * 1024)
            {
                return BadRequest(
                    "PHOTO SIZE MUST NOT EXCEED 10 MB."
                );
            }

            // =====================================================
            // DELETE OLD PHOTO
            // =====================================================

            DeleteExistingPhoto(
                member.PhotoPath
            );

            // =====================================================
            // SAFE FILE NAME
            // =====================================================

            string safeCode =
                string.IsNullOrWhiteSpace(
                    member.MemberCode)
                    ? $"MEM-{member.MemberId:0000}"
                    : member.MemberCode;

            foreach (
                char c in
                Path.GetInvalidFileNameChars())
            {
                safeCode =
                    safeCode.Replace(
                        c,
                        '-'
                    );
            }

            string fileName =
                $"{safeCode}-{Guid.NewGuid():N}{extension}";

            string filePath =
                Path.Combine(
                    _photoFolder,
                    fileName
                );

            // =====================================================
            // SAVE PHOTO
            // =====================================================

            await using (
                var stream =
                    new FileStream(
                        filePath,
                        FileMode.Create,
                        FileAccess.Write,
                        FileShare.None))
            {
                await photo.CopyToAsync(stream);
            }

            member.PhotoPath =
                $"/member-photos/{fileName}";

            member.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER PHOTO UPDATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

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
        public async Task<IActionResult>
            DeleteMemberPhoto(int id)
        {
            var member =
                await _context.Members
                    .FirstOrDefaultAsync(
                        m => m.MemberId == id
                    );

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            DeleteExistingPhoto(
                member.PhotoPath
            );

            member.PhotoPath = "";

            member.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER PHOTO REMOVED.",

                memberId = id
            });
        }

        // =========================================================
        // DEACTIVATE MEMBER
        //
        // DELETE: /api/Members/{id}
        //
        // This is a SOFT DELETE.
        //
        // Permission: Members / delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Members", "delete")]
        public async Task<IActionResult>
            DeactivateMember(int id)
        {
            var member =
                await _context.Members
                    .FirstOrDefaultAsync(
                        m => m.MemberId == id
                    );

            if (member == null)
            {
                return NotFound(new
                {
                    message = "MEMBER NOT FOUND.",
                    memberId = id
                });
            }

            member.Status =
                "INACTIVE";

            member.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER DEACTIVATED SUCCESSFULLY.",

                memberId =
                    member.MemberId,

                memberCode =
                    member.MemberCode,

                status =
                    member.Status
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

            string fileName =
                Path.GetFileName(photoPath);

            if (string.IsNullOrWhiteSpace(
                fileName))
            {
                return;
            }

            string filePath =
                Path.Combine(
                    _photoFolder,
                    fileName
                );

            if (System.IO.File.Exists(
                filePath))
            {
                try
                {
                    System.IO.File.Delete(
                        filePath
                    );
                }
                catch
                {
                    // Do not fail the request
                    // if the old photo cannot
                    // be deleted.
                }
            }
        }

        // =========================================================
        // CLEAN MEMBER
        // =========================================================

        private static void CleanMember(
            Member member)
        {
            member.MemberCode =
                member.MemberCode?
                    .Trim() ?? "";

            member.FirstName =
                member.FirstName?
                    .Trim() ?? "";

            member.MiddleName =
                member.MiddleName?
                    .Trim() ?? "";

            member.LastName =
                member.LastName?
                    .Trim() ?? "";

            member.Gender =
                member.Gender?
                    .Trim()
                    .ToUpper() ?? "";

            member.ContactNumber =
                member.ContactNumber?
                    .Trim() ?? "";

            member.Address =
                member.Address?
                    .Trim() ?? "";

            member.CivilStatus =
                member.CivilStatus?
                    .Trim()
                    .ToUpper() ?? "";

            member.Ministry =
                member.Ministry?
                    .Trim()
                    .ToUpper() ?? "";

            member.Status =
                string.IsNullOrWhiteSpace(
                    member.Status)
                    ? "ACTIVE"
                    : member.Status
                        .Trim()
                        .ToUpper();

            member.PhotoPath =
                member.PhotoPath?
                    .Trim() ?? "";
        }

        // =========================================================
        // GENERATE MEMBER CODE
        // =========================================================

        private async Task<string>
            GenerateMemberCode()
        {
            int nextNumber = 1;

            var lastMember =
                await _context.Members
                    .OrderByDescending(
                        m => m.MemberId)
                    .FirstOrDefaultAsync();

            if (lastMember != null)
            {
                nextNumber =
                    lastMember.MemberId + 1;
            }

            string code;

            do
            {
                code =
                    $"MEM-{nextNumber:0000}";

                nextNumber++;

            } while (
                await _context.Members
                    .AnyAsync(
                        m => m.MemberCode == code)
            );

            return code;
        }
    }
}