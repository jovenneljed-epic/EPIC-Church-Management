using EPIC.Api.Models;

namespace EPIC.Api.Services;

public interface IMemberQrService
{
    Task<MemberQrIdentity> GetOrCreateQr(int memberId);

    Task<MemberQrIdentity?> GetByToken(string token);
}