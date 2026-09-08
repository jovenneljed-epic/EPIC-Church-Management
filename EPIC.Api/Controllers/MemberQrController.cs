using Microsoft.AspNetCore.Mvc;
using EPIC.Api.Services;

namespace EPIC.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MemberQrController : ControllerBase
{
    private readonly IMemberQrService _memberQrService;


    public MemberQrController(IMemberQrService memberQrService)
    {
        _memberQrService = memberQrService;
    }


    [HttpGet("myqr/{memberId}")]
    public async Task<IActionResult> GetMyQr(int memberId)
    {
        var qr = await _memberQrService.GetOrCreateQr(memberId);


        return Ok(new
        {
            qr.Id,
            qr.MemberId,

            memberName = qr.Member != null
                ? $"{qr.Member.FirstName} {qr.Member.LastName}"
                : "",

            qr.QrToken,

            qrUrl =
                $"https://epicchurch.com/q/{qr.QrToken}",

            status = qr.IsActive
                ? "ACTIVE"
                : "INACTIVE",

            qr.CreatedAt
        });
    }



    [HttpGet("validate/{token}")]
    public async Task<IActionResult> ValidateQr(string token)
    {
        var qr = await _memberQrService.GetByToken(token);


        if (qr == null)
        {
            return NotFound(new
            {
                message = "Invalid or inactive QR code"
            });
        }


        return Ok(new
        {
            valid = true,

            qr.MemberId,

            memberName = qr.Member != null
                ? $"{qr.Member.FirstName} {qr.Member.LastName}"
                : "",

            qr.QrToken,

            status = qr.IsActive
                ? "ACTIVE"
                : "INACTIVE"
        });
    }
}