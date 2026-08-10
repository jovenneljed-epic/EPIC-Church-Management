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
                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        ).Trim(),

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
        //
        // Uses MemberId from JWT
        // Permission: Members / view
        // =========================================================

        [HttpGet("me")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMyProfile()
        {
            // =====================================================
            // GET MEMBER ID FROM JWT
            // =====================================================

            var memberIdClaim =
                User.FindFirst("MemberId")?.Value;

            // Some JWT implementations may use lowercase
            // or different claim casing, so also check alternatives.
            if (string.IsNullOrWhiteSpace(memberIdClaim))
            {
                memberIdClaim =
                    User.FindFirst("memberId")?.Value;
            }

            if (string.IsNullOrWhiteSpace(memberIdClaim))
            {
                memberIdClaim =
                    User.FindFirst("member_id")?.Value;
            }

            // =====================================================
            // VALIDATE MEMBER ID
            // =====================================================

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

            // =====================================================
            // GET MEMBER FROM DATABASE
            // =====================================================

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
                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        ).Trim(),

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

            // =====================================================
            // MEMBER NOT FOUND
            // =====================================================

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "MEMBER PROFILE NOT FOUND.",
                    memberId = memberId
                });
            }

            // =====================================================
            // RETURN PROFILE
            // =====================================================

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
                .FirstOrDefaultAsync(
                    m => m.MemberId == id
                );

            if (member == null)
            {
                return NotFound(
                    "MEMBER NOT FOUND."
                );
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
                        m.FirstName
                            .ToLower()
                            .Contains(keyword)

                        ||

                        m.MiddleName
                            .ToLower()
                            .Contains(keyword)

                        ||

                        m.LastName
                            .ToLower()
                            .Contains(keyword)

                        ||

                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        )
                        .ToLower()
                        .Contains(keyword)
                    )
                )
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .Select(m => new
                {
                    memberId = m.MemberId,

                    memberCode = m.MemberCode,

                    fullName =
                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        ).Trim(),

                    ministry = m.Ministry,

                    contactNumber = m.ContactNumber,

                    status = m.Status,

                    photoPath = m.PhotoPath
                })
                .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // GET MEMBER PROFILE BY ID
        // GET: /api/Members/{id}/profile
        // Permission: Members / view
        // =========================================================

        [HttpGet("{id:int}/profile")]
        [Permission("Members", "view")]
        public async Task<IActionResult> GetMemberProfile(
            int id)
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
                        (
                            m.FirstName + " " +
                            m.MiddleName + " " +
                            m.LastName
                        ).Trim(),

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
                return NotFound(
                    "MEMBER NOT FOUND."
                );
            }

            return Ok(member);
        }

        // =========================================================
        // CREATE MEMBER
        // POST: /api/Members
        // Permission: Members / create
        // =========================================================

        [HttpPost]
        [Permission("Members", "create")]
        public async Task<IActionResult> CreateMember(
            Member member)
        {
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
            // CHECK MEMBER CODE
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                member.MemberCode))
            {
                member.MemberCode =
                    member.MemberCode.Trim();

                bool exists =
                    await _context.Members
                        .AnyAsync(m =>
                            m.MemberCode ==
                            member.MemberCode
                        );

                if (exists)
                {
                    return Conflict(
                        "MEMBER CODE ALREADY EXISTS."
                    );
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
            // CLEAN DATA
            // =====================================================

            CleanMember(member);

            member.CreatedDate =
                DateTime.Now;

            member.UpdatedDate =
                null;

            _context.Members.Add(member);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMember),
                new
                {
                    id = member.MemberId
                },
                member
            );
        }

        // =========================================================
        // UPDATE MEMBER + PHOTO
        // PUT: /api/Members/{id}
        // Permission: Members / edit
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Members", "edit")]
        [RequestSizeLimit(10_000_000)]
        public async Task<IActionResult> UpdateMember(
            int id,
            [FromForm] Member updatedMember,
            IFormFile? photo)
        {
            var member =
                await _context.Members
                    .FirstOrDefaultAsync(
                        m => m.MemberId == id
                    );

            if (member == null)
            {
                return NotFound(
                    "MEMBER NOT FOUND."
                );
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
            // MEMBER CODE
            // =====================================================

            string newCode =
                updatedMember.MemberCode?
                    .Trim() ?? "";

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
                    return Conflict(
                        "MEMBER CODE ALREADY EXISTS."
                    );
                }
            }

            // =====================================================
            // UPDATE INFORMATION
            // =====================================================

            member.MemberCode =
                newCode;

            member.FirstName =
                updatedMember.FirstName.Trim();

            member.MiddleName =
                updatedMember.MiddleName?
                    .Trim() ?? "";

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
                    ? "ACTIVE"
                    : updatedMember.Status
                        .Trim()
                        .ToUpper();

            // =====================================================
            // PHOTO UPLOAD
            // =====================================================

            if (photo != null &&
                photo.Length > 0)
            {
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

                // =================================================
                // DELETE OLD PHOTO
                // =================================================

                DeleteExistingPhoto(
                    member.PhotoPath
                );

                // =================================================
                // SAFE FILE NAME
                // =================================================

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

                // =================================================
                // SAVE PHOTO
                // =================================================

                await using (
                    var stream =
                        new FileStream(
                            filePath,
                            FileMode.Create,
                            FileAccess.Write,
                            FileShare.None))
                {
                    await photo.CopyToAsync(
                        stream
                    );
                }

                // =================================================
                // SAVE DATABASE PHOTO PATH
                // =================================================

                member.PhotoPath =
                    $"/member-photos/{fileName}";
            }

            member.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER UPDATED SUCCESSFULLY.",

                member = new
                {
                    member.MemberId,
                    member.MemberCode,
                    member.FirstName,
                    member.MiddleName,
                    member.LastName,
                    member.Gender,
                    member.BirthDate,
                    member.ContactNumber,
                    member.Address,
                    member.CivilStatus,
                    member.Ministry,
                    member.DateJoined,
                    member.Status,
                    member.PhotoPath,
                    member.CreatedDate,
                    member.UpdatedDate
                }
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
                return NotFound(
                    "MEMBER NOT FOUND."
                );
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
        // DELETE: /api/Members/{id}
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
                return NotFound(
                    "MEMBER NOT FOUND."
                );
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
                    // Do not stop member update
                    // if old photo cannot be deleted.
                }
            }
        }

        // =========================================================
        // CLEAN MEMBER
        // =========================================================

        private static void CleanMember(
            Member member)
        {
            member.FirstName =
                member.FirstName.Trim();

            member.MiddleName =
                member.MiddleName?
                    .Trim() ?? "";

            member.LastName =
                member.LastName.Trim();

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

            return $"MEM-{nextNumber:0000}";
        }
    }
}