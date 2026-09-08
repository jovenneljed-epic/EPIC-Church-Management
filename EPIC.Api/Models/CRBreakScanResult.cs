namespace EPIC.Api.Models;

public sealed record CRBreakScanResult(
    bool Success,
    string Message,
    string? Action = null,
    int? MemberId = null,
    string? MemberCode = null,
    string? FirstName = null,
    string? MiddleName = null,
    string? LastName = null,
    DateTime? TimeOut = null,
    DateTime? TimeIn = null);
