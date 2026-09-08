using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.Models;

namespace EPIC.Api.Services;

public class MemberQrService : IMemberQrService
{
    private readonly ApplicationDbContext _context;


    public MemberQrService(ApplicationDbContext context)
    {
        _context = context;
    }


    public async Task<MemberQrIdentity> GetOrCreateQr(int memberId)
    {
        var existing =
            await _context.MemberQrIdentities
                .Include(x => x.Member)
                .FirstOrDefaultAsync(x =>
                    x.MemberId == memberId &&
                    x.IsActive);


        if (existing != null)
            return existing;


        var qr = new MemberQrIdentity
        {
            MemberId = memberId,
            QrToken = Guid.NewGuid().ToString("N"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };


        _context.MemberQrIdentities.Add(qr);

        await _context.SaveChangesAsync();


        // Load Member information after creating QR
        await _context.Entry(qr)
            .Reference(x => x.Member)
            .LoadAsync();


        return qr;
    }



    public async Task<MemberQrIdentity?> GetByToken(string token)
    {
        return await _context.MemberQrIdentities
            .Include(x => x.Member)
            .FirstOrDefaultAsync(x =>
                x.QrToken == token &&
                x.IsActive);
    }
}