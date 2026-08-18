using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

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
        // DEMO REQUESTS
        // =========================================================

        public DbSet<DemoRequest> DemoRequests { get; set; }


        // =========================================================
        // EPIC LEARNING
        // =========================================================

        public DbSet<Course> Courses { get; set; }

        public DbSet<CourseModule> CourseModules { get; set; }

        public DbSet<Lesson> Lessons { get; set; }

        public DbSet<CourseEnrollment> CourseEnrollments { get; set; }

        public DbSet<LessonProgress> LessonProgresses { get; set; }

        public DbSet<Certificate> Certificates { get; set; }


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
            // DEMO REQUESTS
            // =====================================================

            modelBuilder.Entity<DemoRequest>(entity =>
            {
                entity.HasKey(e => e.DemoRequestId);

                entity.Property(e => e.FullName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.ChurchName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.Email)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.Phone)
                    .HasMaxLength(50);

                entity.Property(e => e.Position)
                    .HasMaxLength(100);

                entity.Property(e => e.Message)
                    .HasMaxLength(1000);

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("Pending");

                entity.Property(e => e.AdminNotes)
                    .HasMaxLength(2000);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.ContactedDate)
                    .IsRequired(false);

                entity.Property(e => e.DemoDate)
                    .IsRequired(false);

                entity.HasIndex(e => e.Status);

                entity.HasIndex(e => e.CreatedDate);
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


            // =====================================================
            // EPIC LEARNING
            // =====================================================

            // -----------------------------------------------------
            // COURSE → MODULES
            // -----------------------------------------------------

            modelBuilder.Entity<CourseModule>()
                .HasOne(m => m.Course)
                .WithMany(c => c.Modules)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            // -----------------------------------------------------
            // MODULE → LESSONS
            // -----------------------------------------------------

            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.CourseModule)
                .WithMany(m => m.Lessons)
                .HasForeignKey(l => l.CourseModuleId)
                .OnDelete(DeleteBehavior.Cascade);


            // -----------------------------------------------------
            // COURSE → ENROLLMENTS
            // -----------------------------------------------------

            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            // -----------------------------------------------------
            // USER → ENROLLMENTS
            // -----------------------------------------------------

            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // -----------------------------------------------------
            // ENROLLMENT → LESSON PROGRESS
            // -----------------------------------------------------

            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.CourseEnrollment)
                .WithMany(e => e.LessonProgresses)
                .HasForeignKey(p => p.CourseEnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);


            // -----------------------------------------------------
            // LESSON → PROGRESS
            // -----------------------------------------------------

            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.Lesson)
                .WithMany(l => l.ProgressRecords)
                .HasForeignKey(p => p.LessonId)
                .OnDelete(DeleteBehavior.Restrict);


            // -----------------------------------------------------
            // COURSE → CERTIFICATES
            // -----------------------------------------------------

            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Course)
                .WithMany(c => c.Certificates)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);


            // -----------------------------------------------------
            // USER → CERTIFICATES
            // -----------------------------------------------------

            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // -----------------------------------------------------
            // UNIQUE COURSE ENROLLMENT
            // -----------------------------------------------------

            modelBuilder.Entity<CourseEnrollment>()
                .HasIndex(e => new
                {
                    e.CourseId,
                    e.UserId
                })
                .IsUnique();


            // -----------------------------------------------------
            // UNIQUE CERTIFICATE NUMBER
            // -----------------------------------------------------

            modelBuilder.Entity<Certificate>()
                .HasIndex(c => c.CertificateNumber)
                .IsUnique();


            // -----------------------------------------------------
            // UNIQUE LESSON PROGRESS
            // -----------------------------------------------------

            modelBuilder.Entity<LessonProgress>()
                .HasIndex(p => new
                {
                    p.CourseEnrollmentId,
                    p.LessonId
                })
                .IsUnique();


            // -----------------------------------------------------
            // PROGRESS DEFAULT VALUES
            // -----------------------------------------------------

            modelBuilder.Entity<CourseEnrollment>()
                .Property(e => e.ProgressPercentage)
                .HasDefaultValue(0);

            modelBuilder.Entity<LessonProgress>()
                .Property(p => p.ProgressPercentage)
                .HasDefaultValue(0);


            // =====================================================
            // IMPORTANT
            // =====================================================
            //
            // DO NOT PUT THE OLD EPIC LEARNING HasData() SEED HERE.
            //
            // Your learning data is already established by:
            //
            // 20260813094435_SeedFoundationsDiscipleshipLessons
            //
            // Your CURRENT database contains:
            //
            // Module 1  = ID 1
            // Module 2  = ID 11
            // Module 3  = ID 12
            // Module 4  = ID 13
            // Module 5  = ID 14
            // Module 6  = ID 15
            // Module 7  = ID 16
            // Module 8  = ID 17
            // Module 9  = ID 18
            // Module 10 = ID 19
            //
            // Lessons currently use IDs 1, 3-61.
            //
            // Reintroducing the old HasData() seed would cause EF Core
            // to attempt inserting CourseModule IDs 1-10 again.
            //
            // Therefore the existing learning seed migration remains
            // the source of the initial learning data.
            //
            // =====================================================
        }
    }
}