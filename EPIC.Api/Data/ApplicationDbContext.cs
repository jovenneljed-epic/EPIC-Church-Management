
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
        // DEMO / SALES / SUBSCRIPTION
        // =========================================================

        public DbSet<DemoRequest> DemoRequests { get; set; }

        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

        public DbSet<Subscription> Subscriptions { get; set; }

        public DbSet<Payment> Payments { get; set; }


        // =========================================================
        // EPIC LEARNING
        // =========================================================

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


            // =========================================================
            // SUBSCRIPTION PLAN
            // =========================================================

            modelBuilder.Entity<SubscriptionPlan>(entity =>
            {
                entity.HasKey(e => e.SubscriptionPlanId);

                entity.Property(e => e.PlanName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.MonthlyPrice)
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.AnnualPrice)
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.TrialDays)
                    .HasDefaultValue(0);

                entity.Property(e => e.MaxUsers)
                    .HasDefaultValue(5);

                entity.Property(e => e.MaxMembers)
                    .HasDefaultValue(500);

                entity.Property(e => e.IncludesChurchManagement)
                    .HasDefaultValue(true);

                entity.Property(e => e.IncludesAttendance)
                    .HasDefaultValue(true);

                entity.Property(e => e.IncludesGiving)
                    .HasDefaultValue(true);

                entity.Property(e => e.IncludesFinance)
                    .HasDefaultValue(true);

                entity.Property(e => e.IncludesMinistries)
                    .HasDefaultValue(true);

                entity.Property(e => e.IncludesEPICLearning)
                    .HasDefaultValue(false);

                entity.Property(e => e.IncludesReports)
                    .HasDefaultValue(true);

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                entity.Property(e => e.SortOrder)
                    .HasDefaultValue(0);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();
            });


            // =========================================================
            // SUBSCRIPTION
            // =========================================================

            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(e => e.SubscriptionId);

                entity.Property(e => e.ChurchName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.ContactName)
                    .HasMaxLength(200);

                entity.Property(e => e.ContactEmail)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.ContactPhone)
                    .HasMaxLength(50);

                entity.Property(e => e.BillingCycle)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("Monthly");

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.Currency)
                    .HasMaxLength(10)
                    .IsRequired()
                    .HasDefaultValue("PHP");

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("TRIAL");

                entity.Property(e => e.PaymentCustomerId)
                    .HasMaxLength(200);

                entity.Property(e => e.PaymentSubscriptionId)
                    .HasMaxLength(200);

                entity.Property(e => e.Notes)
                    .HasMaxLength(2000);

                // =====================================================
                // SUBSCRIPTION → SUBSCRIPTION PLAN
                // =====================================================

                entity.HasOne<SubscriptionPlan>(e => e.SubscriptionPlan)
     .WithMany(p => p.Subscriptions)
     .HasForeignKey(e => e.SubscriptionPlanId)
     .IsRequired()
     .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // INDEXES
                // =====================================================

                entity.HasIndex(e => e.SubscriptionPlanId);

                entity.HasIndex(e => e.Status);

                entity.HasIndex(e => e.ContactEmail);

                entity.HasIndex(e => e.CreatedDate);
            });
            // =====================================================
            // PAYMENT
            // =====================================================

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.Property(e => e.Currency)
                    .HasMaxLength(10)
                    .IsRequired()
                    .HasDefaultValue("PHP");

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("Manual");

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("PENDING");

                entity.Property(e => e.ReferenceNumber)
                    .HasMaxLength(200);

                entity.Property(e => e.GatewayPaymentId)
                    .HasMaxLength(200);

                entity.Property(e => e.GatewayCheckoutId)
                    .HasMaxLength(200);

                entity.Property(e => e.GatewayCustomerId)
                    .HasMaxLength(200);

                entity.Property(e => e.InvoiceNumber)
                    .HasMaxLength(100);

                entity.Property(e => e.ReceiptNumber)
                    .HasMaxLength(100);

                entity.Property(e => e.FailureReason)
                    .HasMaxLength(1000);

                entity.Property(e => e.Notes)
                    .HasMaxLength(2000);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();


                // =================================================
                // PAYMENT → SUBSCRIPTION
                // =================================================

                entity.HasOne(e => e.Subscription)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(e => e.SubscriptionId)
                    .OnDelete(DeleteBehavior.Cascade);


                // =================================================
                // INDEXES
                // =================================================

                entity.HasIndex(e => e.Status);

                entity.HasIndex(e => e.ReferenceNumber);

                entity.HasIndex(e => e.GatewayPaymentId);

                entity.HasIndex(e => e.CreatedDate);
            });


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

            modelBuilder.Entity<CourseModule>()
                .HasOne(m => m.Course)
                .WithMany(c => c.Modules)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.CourseModule)
                .WithMany(m => m.Lessons)
                .HasForeignKey(l => l.CourseModuleId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.CourseEnrollment)
                .WithMany(e => e.LessonProgresses)
                .HasForeignKey(p => p.CourseEnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.Lesson)
                .WithMany(l => l.ProgressRecords)
                .HasForeignKey(p => p.LessonId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Course)
                .WithMany(c => c.Certificates)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // UNIQUE COURSE ENROLLMENT
            // =====================================================

            modelBuilder.Entity<CourseEnrollment>()
                .HasIndex(e => new
                {
                    e.CourseId,
                    e.UserId
                })
                .IsUnique();


            // =====================================================
            // UNIQUE CERTIFICATE NUMBER
            // =====================================================

            modelBuilder.Entity<Certificate>()
                .HasIndex(c => c.CertificateNumber)
                .IsUnique();


            // =====================================================
            // UNIQUE LESSON PROGRESS
            // =====================================================

            modelBuilder.Entity<LessonProgress>()
                .HasIndex(p => new
                {
                    p.CourseEnrollmentId,
                    p.LessonId
                })
                .IsUnique();


            // =====================================================
            // PROGRESS DEFAULT VALUES
            // =====================================================

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
            // DO NOT ADD THE OLD EPIC LEARNING HasData() SEED HERE.
            //
            // Existing learning data is already established by:
            //
            // 20260813094435_SeedFoundationsDiscipleshipLessons
            //
            // Current learning module IDs:
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
            // Do not reintroduce the old seed.
            //
            // =====================================================
        }
    }
}

