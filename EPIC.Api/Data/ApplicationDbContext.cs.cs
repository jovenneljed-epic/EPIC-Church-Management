using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace EPIC.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // =========================================================
        // DATABASE TABLES
        // =========================================================

        public DbSet<User> Users { get; set; }

        public DbSet<Member> Members { get; set; }

        public DbSet<Attendance> Attendances { get; set; }

        public DbSet<Income> Incomes { get; set; }

        public DbSet<Expense> Expenses { get; set; }

        public DbSet<Visitor> Visitors { get; set; }

        public DbSet<VisitorAttendance> VisitorAttendances { get; set; }

        public DbSet<Ministry> Ministries { get; set; }

        public DbSet<MinistryMember> MinistryMembers { get; set; }

        public DbSet<MinistryPerformanceRating>
            MinistryPerformanceRatings
        { get; set; }

        public DbSet<ChurchService> ChurchServices { get; set; }

        public DbSet<Giving> Givings { get; set; }

        public DbSet<Event> Events { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<Permission> Permissions { get; set; }

        public DbSet<ChurchSettings> ChurchSettings { get; set; }
        public DbSet<CRBreakPass> CRBreakPasses { get; set; }



        // =========================================================
        // MODEL CONFIGURATION
        // =========================================================

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =====================================================
            // CHURCH SETTINGS
            // =====================================================

            modelBuilder.Entity<ChurchSettings>(entity =>
            {
                entity.HasKey(e => e.ChurchSettingsId);

                entity.Property(e => e.ChurchName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.ChurchCode)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.Address)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(e => e.ContactNumber)
                    .HasMaxLength(50);

                entity.Property(e => e.Email)
                    .HasMaxLength(150);

                entity.Property(e => e.PastorName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.LogoPath)
                    .HasMaxLength(500);

                entity.Property(e => e.UpdatedDate)
                    .IsRequired();
            });
            // =====================================================
            // ATTENDANCE → MEMBER
            // =====================================================

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Member)
                .WithMany()
                .HasForeignKey(a => a.MemberId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // ATTENDANCE → CHURCH SERVICE
            // =====================================================

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.ChurchService)
                .WithMany()
                .HasForeignKey(a => a.ChurchServiceId)
                .OnDelete(DeleteBehavior.SetNull);


            // =====================================================
            // UNIQUE MEMBER ATTENDANCE
            // =====================================================

            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new
                {
                    a.MemberId,
                    a.ChurchServiceId
                })
                .HasFilter("[ChurchServiceId] IS NOT NULL")
                .IsUnique();


            // =====================================================
            // VISITOR ATTENDANCE → VISITOR
            // =====================================================

            modelBuilder.Entity<VisitorAttendance>()
                .HasOne(va => va.Visitor)
                .WithMany()
                .HasForeignKey(va => va.VisitorId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // VISITOR ATTENDANCE → CHURCH SERVICE
            // =====================================================

            modelBuilder.Entity<VisitorAttendance>()
                .HasOne(va => va.ChurchService)
                .WithMany()
                .HasForeignKey(va => va.ChurchServiceId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // UNIQUE VISITOR ATTENDANCE
            // =====================================================

            modelBuilder.Entity<VisitorAttendance>()
                .HasIndex(va => new
                {
                    va.VisitorId,
                    va.ChurchServiceId
                })
                .IsUnique();


            // =====================================================
            // GIVING → MEMBER
            // =====================================================

            modelBuilder.Entity<Giving>()
                .HasOne(g => g.Member)
                .WithMany()
                .HasForeignKey(g => g.MemberId)
                .OnDelete(DeleteBehavior.SetNull);


            // =====================================================
            // GIVING → CHURCH SERVICE
            // =====================================================

            modelBuilder.Entity<Giving>()
                .HasOne(g => g.ChurchService)
                .WithMany()
                .HasForeignKey(g => g.ChurchServiceId)
                .OnDelete(DeleteBehavior.SetNull);


            // =====================================================
            // GIVING AMOUNT
            // =====================================================

            modelBuilder.Entity<Giving>()
                .Property(g => g.Amount)
                .HasColumnType("decimal(18,2)");


            // =====================================================
            // UNIQUE VISITOR CODE
            // =====================================================

            modelBuilder.Entity<Visitor>()
                .HasIndex(v => v.VisitorCode)
                .IsUnique();


            // =====================================================
            // MINISTRY PERFORMANCE RATING
            // → MINISTRY MEMBER
            // =====================================================

            modelBuilder.Entity<MinistryPerformanceRating>()
                .HasOne(p => p.MinistryMember)
                .WithMany()
                .HasForeignKey(p => p.MinistryMemberId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // PERFORMANCE RATING DECIMAL PRECISION
            // =====================================================

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.AttendanceRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.CommitmentRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.ParticipationRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.TeamworkRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.SpiritualGrowthRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.LeadershipRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.ResponsibilityRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<MinistryPerformanceRating>()
                .Property(p => p.OverallRating)
                .HasColumnType("decimal(3,2)");


            // =====================================================
            // USER → ROLE
            // =====================================================

            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // ROLE → PERMISSIONS
            // =====================================================

            modelBuilder.Entity<Permission>()
                .HasOne(p => p.Role)
                .WithMany(r => r.Permissions)
                .HasForeignKey(p => p.RoleId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // UNIQUE ROLE NAME
            // =====================================================

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.RoleName)
                .IsUnique();


            // =====================================================
            // UNIQUE ROLE + MODULE
            // =====================================================

            modelBuilder.Entity<Permission>()
                .HasIndex(p => new
                {
                    p.RoleId,
                    p.Module
                })
                .IsUnique();
        }
    }
}