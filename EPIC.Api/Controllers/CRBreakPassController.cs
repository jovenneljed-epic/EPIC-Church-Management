using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CRBreakPassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CRBreakPassController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ACTIVE CR PASSES
        // GET: /api/CRBreakPass
        // =========================================================

        [HttpGet]
        [Permission("CRBreakPass", "view")]
        public async Task<IActionResult> GetAll()
        {
            var passes = await _context.CRBreakPasses
                .Include(p => p.Member)
                .Where(p => p.Status == "ACTIVE")
                .OrderBy(p => p.Member!.LastName)
                .ThenBy(p => p.Member!.FirstName)
                .Select(p => new
                {
                    crBreakPassId = p.CRBreakPassId,
                    memberId = p.MemberId,
                    memberCode = p.Member!.MemberCode,
                    firstName = p.Member.FirstName,
                    middleName = p.Member.MiddleName,
                    lastName = p.Member.LastName,
                    passCode = p.PassCode,
                    qrToken = p.QrToken,
                    status = p.Status,
                    issuedAt = p.IssuedAt,
                    timeOut = p.TimeOut,
                    timeIn = p.TimeIn,
                    expiresAt = p.ExpiresAt
                })
                .ToListAsync();

            return Ok(passes);
        }


        // =========================================================
        // GET PASS FOR ONE MEMBER
        // GET: /api/CRBreakPass/member/1038
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        [Permission("CRBreakPass", "view")]
        public async Task<IActionResult> GetByMember(int memberId)
        {
            var member = await _context.Members
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MemberId == memberId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Member not found."
                });
            }

            var pass = await _context.CRBreakPasses
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.MemberId == memberId &&
                    p.Status == "ACTIVE");

            if (pass == null)
            {
                return Ok(new
                {
                    hasPass = false,
                    memberId = member.MemberId,
                    memberCode = member.MemberCode,
                    firstName = member.FirstName,
                    middleName = member.MiddleName,
                    lastName = member.LastName
                });
            }

            return Ok(new
            {
                hasPass = true,
                crBreakPassId = pass.CRBreakPassId,
                memberId = member.MemberId,
                memberCode = member.MemberCode,
                firstName = member.FirstName,
                middleName = member.MiddleName,
                lastName = member.LastName,
                passCode = pass.PassCode,
                qrToken = pass.QrToken,
                status = pass.Status,
                issuedAt = pass.IssuedAt,
                timeOut = pass.TimeOut,
                timeIn = pass.TimeIn,
                expiresAt = pass.ExpiresAt
            });
        }


        // =========================================================
        // CREATE CR BREAK PASS
        // POST: /api/CRBreakPass/member/1038
        // =========================================================

        [HttpPost("member/{memberId:int}")]
        [Permission("CRBreakPass", "create")]
        public async Task<IActionResult> CreatePass(int memberId)
        {
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.MemberId == memberId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Member not found."
                });
            }

            if (member.Status != "ACTIVE")
            {
                return BadRequest(new
                {
                    message = "Only active members can have a CR Break Pass."
                });
            }

            var existingPass = await _context.CRBreakPasses
                .FirstOrDefaultAsync(p =>
                    p.MemberId == memberId &&
                    p.Status == "ACTIVE");

            if (existingPass != null)
            {
                return Ok(new
                {
                    message = "Member already has an active CR Break Pass.",
                    crBreakPassId = existingPass.CRBreakPassId,
                    memberId = member.MemberId,
                    memberCode = member.MemberCode,
                    firstName = member.FirstName,
                    middleName = member.MiddleName,
                    lastName = member.LastName,
                    passCode = existingPass.PassCode,
                    qrToken = existingPass.QrToken,
                    status = existingPass.Status,
                    issuedAt = existingPass.IssuedAt,
                    timeOut = existingPass.TimeOut,
                    timeIn = existingPass.TimeIn
                });
            }

            var passCode = await GenerateUniquePassCode();
            var qrToken = GenerateQrToken();

            var pass = new CRBreakPass
            {
                MemberId = memberId,
                PassCode = passCode,
                QrToken = qrToken,
                Status = "ACTIVE",
                IssuedAt = DateTime.Now,
                CreatedBy =
                    User.Identity?.Name
                    ?? User.FindFirst("name")?.Value
                    ?? "SYSTEM"
            };

            _context.CRBreakPasses.Add(pass);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "CR Break Pass created successfully.",

                crBreakPassId = pass.CRBreakPassId,

                memberId = member.MemberId,
                memberCode = member.MemberCode,

                firstName = member.FirstName,
                middleName = member.MiddleName,
                lastName = member.LastName,

                passCode = pass.PassCode,
                qrToken = pass.QrToken,

                status = pass.Status,
                issuedAt = pass.IssuedAt
            });
        }


        // =========================================================
        // SCAN QR
        // POST: /api/CRBreakPass/scan
        //
        // FIRST SCAN  = TIME OUT
        // SECOND SCAN = TIME IN
        // =========================================================

        [HttpPost("scan")]
        [Permission("CRBreakPass", "edit")]
        public async Task<IActionResult> Scan(
            [FromBody] ScanQrRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.QrToken))
            {
                return BadRequest(new
                {
                    message = "QR token is required."
                });
            }

            var pass = await _context.CRBreakPasses
                .Include(p => p.Member)
                .FirstOrDefaultAsync(p =>
                    p.QrToken == request.QrToken &&
                    p.Status == "ACTIVE");

            if (pass == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Invalid or inactive CR Break Pass."
                });
            }

            if (pass.ExpiresAt.HasValue &&
                DateTime.Now > pass.ExpiresAt.Value)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This CR Break Pass has expired."
                });
            }

            // =====================================================
            // FIRST SCAN → TIME OUT
            // =====================================================

            if (!pass.TimeOut.HasValue)
            {
                pass.TimeOut = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    action = "TIME_OUT",

                    message =
                        $"{pass.Member!.FirstName} {pass.Member.LastName} is now OUT.",

                    memberId = pass.MemberId,
                    memberCode = pass.Member.MemberCode,

                    firstName = pass.Member.FirstName,
                    middleName = pass.Member.MiddleName,
                    lastName = pass.Member.LastName,

                    timeOut = pass.TimeOut,
                    timeIn = pass.TimeIn
                });
            }

            // =====================================================
            // SECOND SCAN → TIME IN
            // =====================================================

            if (!pass.TimeIn.HasValue)
            {
                pass.TimeIn = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    action = "TIME_IN",

                    message =
                        $"{pass.Member!.FirstName} {pass.Member.LastName} is now IN.",

                    memberId = pass.MemberId,
                    memberCode = pass.Member.MemberCode,

                    firstName = pass.Member.FirstName,
                    middleName = pass.Member.MiddleName,
                    lastName = pass.Member.LastName,

                    timeOut = pass.TimeOut,
                    timeIn = pass.TimeIn
                });
            }

            // =====================================================
            // ALREADY COMPLETED
            // =====================================================

            return Ok(new
            {
                success = true,
                action = "COMPLETED",

                message =
                    $"{pass.Member!.FirstName} {pass.Member.LastName} has already completed the CR break.",

                memberId = pass.MemberId,
                memberCode = pass.Member.MemberCode,

                firstName = pass.Member.FirstName,
                middleName = pass.Member.MiddleName,
                lastName = pass.Member.LastName,

                timeOut = pass.TimeOut,
                timeIn = pass.TimeIn
            });
        }


        // =========================================================
        // RESET PASS FOR NEXT SERVICE
        // POST: /api/CRBreakPass/reset/{memberId}
        // =========================================================

        [HttpPost("reset/{memberId:int}")]
        [Permission("CRBreakPass", "edit")]
        public async Task<IActionResult> ResetPass(int memberId)
        {
            var pass = await _context.CRBreakPasses
                .FirstOrDefaultAsync(p =>
                    p.MemberId == memberId &&
                    p.Status == "ACTIVE");

            if (pass == null)
            {
                return NotFound(new
                {
                    message = "Active CR Break Pass not found."
                });
            }

            pass.TimeOut = null;
            pass.TimeIn = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "CR Break Pass reset successfully.",
                memberId = memberId,
                passCode = pass.PassCode
            });
        }


        // =========================================================
        // DEACTIVATE PASS
        // DELETE: /api/CRBreakPass/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("CRBreakPass", "delete")]
        public async Task<IActionResult> DeactivatePass(int id)
        {
            var pass = await _context.CRBreakPasses
                .FirstOrDefaultAsync(p =>
                    p.CRBreakPassId == id);

            if (pass == null)
            {
                return NotFound(new
                {
                    message = "CR Break Pass not found."
                });
            }

            pass.Status = "INACTIVE";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "CR Break Pass deactivated successfully."
            });
        }


        // =========================================================
        // GENERATE UNIQUE PASS CODE
        // =========================================================

        private async Task<string> GenerateUniquePassCode()
        {
            while (true)
            {
                var code =
                    "CR-" +
                    RandomNumberGenerator
                        .GetInt32(100000, 999999);

                var exists =
                    await _context.CRBreakPasses
                        .AnyAsync(p =>
                            p.PassCode == code);

                if (!exists)
                {
                    return code;
                }
            }
        }


        // =========================================================
        // GENERATE SECURE QR TOKEN
        // =========================================================

        private static string GenerateQrToken()
        {
            var bytes = new byte[32];

            RandomNumberGenerator.Fill(bytes);

            return Convert.ToBase64String(bytes)
                .Replace("+", "")
                .Replace("/", "")
                .Replace("=", "");
        }
    }


    // =============================================================
    // REQUEST MODEL
    // =============================================================

    public class ScanQrRequest
    {
        public string QrToken { get; set; } = string.Empty;
    }
}