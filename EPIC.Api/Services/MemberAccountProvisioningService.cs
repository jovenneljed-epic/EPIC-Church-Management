using BCrypt.Net;

using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace EPIC.Api.Services
{
    public class MemberAccountProvisioningService
    {
        private readonly ApplicationDbContext _context;

        public MemberAccountProvisioningService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // PROVISION ONE MEMBER
        // =========================================================

        public async Task<MemberAccountProvisioningResult>
            ProvisionMemberAsync(
                int memberId,
                bool saveChanges = true)
        {
            var member =
                await _context.Members
                    .Include(m => m.Customer)
                    .FirstOrDefaultAsync(
                        m => m.MemberId == memberId);

            if (member == null)
            {
                return new MemberAccountProvisioningResult
                {
                    Success = false,
                    Created = false,
                    Message = "MEMBER NOT FOUND."
                };
            }

            if (member.Customer == null)
            {
                return new MemberAccountProvisioningResult
                {
                    Success = false,
                    Created = false,
                    Message = "MEMBER IS NOT LINKED TO A CUSTOMER."
                };
            }

            // -----------------------------------------------------
            // CHECK EXISTING ACCOUNT BY MEMBER ID
            // -----------------------------------------------------

            var existingUser =
                await _context.Users
                    .FirstOrDefaultAsync(u =>
                        u.MemberId == member.MemberId);

            if (existingUser != null)
            {
                return new MemberAccountProvisioningResult
                {
                    Success = true,
                    Created = false,

                    UserId =
                        existingUser.UserId,

                    Username =
                        existingUser.Username,

                    MemberId =
                        member.MemberId,

                    CustomerId =
                        member.CustomerId,

                    Message =
                        "MEMBER ACCOUNT ALREADY EXISTS."
                };
            }

            // -----------------------------------------------------
            // FIND MEMBER ROLE
            // -----------------------------------------------------

            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleName != null &&
                        r.RoleName.Trim().ToUpper() == "MEMBER" &&
                        r.IsActive);

            if (role == null)
            {
                return new MemberAccountProvisioningResult
                {
                    Success = false,
                    Created = false,
                    Message =
                        "MEMBER ROLE DOES NOT EXIST OR IS INACTIVE."
                };
            }

            // -----------------------------------------------------
            // GENERATE UNIQUE USERNAME
            //
            // Example:
            //
            // MEM-1-0001
            //
            // Customer 1 / MemberCode MEM-0001
            // -----------------------------------------------------

            var username =
                await GenerateUsernameAsync(
                    member.CustomerId,
                    member.MemberCode);

            // -----------------------------------------------------
            // GENERATE TEMPORARY PASSWORD
            // -----------------------------------------------------

            var temporaryPassword =
                GenerateTemporaryPassword();

            // -----------------------------------------------------
            // BUILD FULL NAME
            // -----------------------------------------------------

            var fullName =
                BuildFullName(
                    member.FirstName,
                    member.MiddleName,
                    member.LastName);

            // -----------------------------------------------------
            // CREATE USER
            // -----------------------------------------------------

            var user = new User
            {
                Username =
                    username,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        temporaryPassword),

                FullName =
                    fullName,

                RoleId =
                    role.RoleId,

                MemberId =
                    member.MemberId,

                CustomerId =
                    member.CustomerId,

                IsActive =
                    true,

                ApprovalStatus =
                    "APPROVED",

                AccountType =
                    "MEMBER",

                Email =
                    null,

                LastLoginDate =
                    null,

                PasswordChangedDate =
                    null,

                CreatedDate =
                    DateTime.Now,

                UpdatedDate =
                    null
            };

            _context.Users.Add(user);

            if (saveChanges)
            {
                await _context.SaveChangesAsync();
            }

            return new MemberAccountProvisioningResult
            {
                Success = true,
                Created = true,

                UserId =
                    user.UserId,

                Username =
                    username,

                TemporaryPassword =
                    temporaryPassword,

                MemberId =
                    member.MemberId,

                CustomerId =
                    member.CustomerId,

                MemberCode =
                    member.MemberCode,

                FullName =
                    fullName,

                Message =
                    "MEMBER ACCOUNT CREATED SUCCESSFULLY."
            };
        }

        // =========================================================
        // PROVISION ALL MEMBERS WITHOUT ACCOUNTS
        // =========================================================

        public async Task<
            List<MemberAccountProvisioningResult>>
            ProvisionAllMembersAsync()
        {
            var members =
                await _context.Members
                    .AsNoTracking()
                    .Select(m => m.MemberId)
                    .ToListAsync();

            var results =
                new List<MemberAccountProvisioningResult>();

            foreach (var memberId in members)
            {
                var result =
                    await ProvisionMemberAsync(
                        memberId,
                        saveChanges: true);

                results.Add(result);
            }

            return results;
        }

        // =========================================================
        // GENERATE USERNAME
        // =========================================================

        private async Task<string>
            GenerateUsernameAsync(
                int customerId,
                string? memberCode)
        {
            var safeMemberCode =
                string.IsNullOrWhiteSpace(memberCode)
                    ? "MEMBER"
                    : memberCode.Trim();

            var baseUsername =
                $"MEM-{customerId}-{safeMemberCode}";

            var username =
                baseUsername;

            var counter = 1;

            while (
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u =>
                        u.Username != null &&
                        u.Username.ToUpper() ==
                        username.ToUpper()))
            {
                username =
                    $"{baseUsername}-{counter}";

                counter++;
            }

            return username;
        }

        // =========================================================
        // GENERATE TEMPORARY PASSWORD
        // =========================================================

        private static string
            GenerateTemporaryPassword()
        {
            const string upper =
                "ABCDEFGHJKLMNPQRSTUVWXYZ";

            const string lower =
                "abcdefghijkmnopqrstuvwxyz";

            const string numbers =
                "23456789";

            const string symbols =
                "!@#$%";

            var passwordChars =
                new List<char>
                {
                    GetRandomCharacter(upper),
                    GetRandomCharacter(lower),
                    GetRandomCharacter(numbers),
                    GetRandomCharacter(symbols)
                };

            var all =
                upper +
                lower +
                numbers +
                symbols;

            while (passwordChars.Count < 12)
            {
                passwordChars.Add(
                    GetRandomCharacter(all));
            }

            return new string(
                passwordChars
                    .OrderBy(_ => RandomNumberGenerator
                        .GetInt32(0, int.MaxValue))
                    .ToArray());
        }

        private static char
            GetRandomCharacter(
                string source)
        {
            var index =
                RandomNumberGenerator.GetInt32(
                    0,
                    source.Length);

            return source[index];
        }

        // =========================================================
        // FULL NAME
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
                    !string.IsNullOrWhiteSpace(x)));
        }
    }

    // =============================================================
    // RESULT
    // =============================================================

    public class MemberAccountProvisioningResult
    {
        public bool Success { get; set; }

        public bool Created { get; set; }

        public int? UserId { get; set; }

        public int? MemberId { get; set; }

        public int? CustomerId { get; set; }

        public string? MemberCode { get; set; }

        public string? FullName { get; set; }

        public string? Username { get; set; }

        public string? TemporaryPassword { get; set; }

        public string Message { get; set; } = "";
    }
}