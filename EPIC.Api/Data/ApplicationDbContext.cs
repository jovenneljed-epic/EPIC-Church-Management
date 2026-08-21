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

        // =========================================================
        // EVENTS
        // =========================================================

        public DbSet<Event> Events { get; set; }
        public DbSet<EventDepartment> EventDepartments { get; set; }
        public DbSet<EventRole> EventRoles { get; set; }
        public DbSet<EventAssignment> EventAssignments { get; set; }
        public DbSet<EventNeed> EventNeeds { get; set; }
        public DbSet<EventChecklist> EventChecklists { get; set; }

        // =========================================================
        // ROLES / PERMISSIONS
        // =========================================================

        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }

        // =========================================================
        // SETTINGS
        // =========================================================

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

        public DbSet<Course> Courses { get; set; }
        public DbSet<CourseModule> CourseModules { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<CourseEnrollment> CourseEnrollments { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<Certificate> Certificates { get; set; }

        // =========================================================
        // MODEL CONFIGURATION
        // =========================================================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =====================================================
            // EVENT
            // =====================================================

            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.EventId);

                entity.Property(e => e.Title)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.EventType)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Venue)
                    .HasMaxLength(200);

                entity.Property(e => e.Speaker)
                    .HasMaxLength(200);

                entity.Property(e => e.Ministry)
                    .HasMaxLength(150);

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("SCHEDULED");

                entity.Property(e => e.Description);

                entity.Property(e => e.Notes);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventDate);
                entity.HasIndex(e => e.EventType);
                entity.HasIndex(e => e.Status);
            });

            // =====================================================
            // EVENT DEPARTMENT
            // =====================================================

            modelBuilder.Entity<EventDepartment>(entity =>
            {
                entity.HasKey(e => e.EventDepartmentId);

                entity.HasOne(e => e.Event)
                    .WithMany()
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.DepartmentHeadMember)
                    .WithMany()
                    .HasForeignKey(e => e.DepartmentHeadMemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.DepartmentName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.DepartmentDescription)
                    .HasMaxLength(500);

                entity.Property(e => e.Priority)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("PLANNING");

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.DepartmentHeadMemberId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
            });

            // =====================================================
            // EVENT ROLE
            // =====================================================

            modelBuilder.Entity<EventRole>(entity =>
            {
                entity.HasKey(e => e.EventRoleId);

                entity.HasOne(e => e.EventDepartment)
                    .WithMany()
                    .HasForeignKey(e => e.EventDepartmentId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.Property(e => e.RoleName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.RoleDescription)
                    .HasMaxLength(500);

                entity.Property(e => e.Priority)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("ACTIVE");

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasIndex(e => e.EventDepartmentId);
                entity.HasIndex(e => e.RoleName);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
            });

            // =====================================================
            // EVENT ASSIGNMENT
            // =====================================================

            modelBuilder.Entity<EventAssignment>(entity =>
            {
                entity.HasKey(e => e.EventAssignmentId);

                entity.HasOne(e => e.Event)
                    .WithMany(e => e.EventAssignments)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.EventDepartment)
                    .WithMany()
                    .HasForeignKey(e => e.EventDepartmentId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.EventRole)
                    .WithMany(r => r.EventAssignments)
                    .HasForeignKey(e => e.EventRoleId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.Property(e => e.AssignedPerson)
                    .HasMaxLength(200)
                    .IsRequired(false);

                entity.Property(e => e.DepartmentName)
                    .HasMaxLength(150)
                    .IsRequired(false);

                entity.Property(e => e.RoleName)
                    .HasMaxLength(150)
                    .IsRequired(false);

                entity.Property(e => e.AssignmentStatus)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("PENDING");

                entity.Property(e => e.Priority)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.Notes)
                    .IsRequired(false);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.EventDepartmentId);
                entity.HasIndex(e => e.EventRoleId);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.AssignmentStatus);
                entity.HasIndex(e => e.Priority);
            });

            // =====================================================
            // EVENT NEED
            // =====================================================

            modelBuilder.Entity<EventNeed>(entity =>
            {
                entity.HasKey(e => e.EventNeedId);

                entity.HasOne(e => e.Event)
                    .WithMany(e => e.EventNeeds)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ResponsibleMember)
                    .WithMany()
                    .HasForeignKey(e => e.ResponsibleMemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.Property(e => e.NeedName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.Category)
                    .HasMaxLength(100);

                entity.Property(e => e.Quantity)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(1m);

                entity.Property(e => e.Unit)
                    .HasMaxLength(50);

                entity.Property(e => e.ResponsiblePerson)
                    .HasMaxLength(200);

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("PENDING");

                entity.Property(e => e.Priority)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.Notes);

                entity.Property(e => e.NeededBy)
                    .IsRequired(false);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.ResponsibleMemberId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
                entity.HasIndex(e => e.Category);
            });

            // =====================================================
            // EVENT CHECKLIST
            // =====================================================

            modelBuilder.Entity<EventChecklist>(entity =>
            {
                entity.HasKey(e => e.EventChecklistId);

                entity.HasOne(e => e.Event)
                    .WithMany(e => e.EventChecklists)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.AssignedMember)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedMemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.CompletedByMember)
                    .WithMany()
                    .HasForeignKey(e => e.CompletedByMemberId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.Property(e => e.TaskName)
                    .HasMaxLength(300)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.Category)
                    .HasMaxLength(100);

                entity.Property(e => e.AssignedPerson)
                    .HasMaxLength(200);

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("PENDING");

                entity.Property(e => e.Priority)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.SortOrder)
                    .HasDefaultValue(0);

                entity.Property(e => e.DueDate)
                    .IsRequired(false);

                entity.Property(e => e.CompletedAt)
                    .IsRequired(false);

                entity.Property(e => e.Notes);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.AssignedMemberId);
                entity.HasIndex(e => e.CompletedByMemberId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.SortOrder);
            });

            // =====================================================
            // ATTENDANCE → EVENT
            // =====================================================

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Event)
                .WithMany()
                .HasForeignKey(a => a.EventId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new
                {
                    a.MemberId,
                    a.ChurchServiceId
                })
                .HasFilter("[ChurchServiceId] IS NOT NULL")
                .IsUnique();

            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new
                {
                    a.MemberId,
                    a.EventId
                })
                .HasFilter("[EventId] IS NOT NULL")
                .IsUnique();

            // =====================================================
            // VISITOR ATTENDANCE
            // =====================================================

            modelBuilder.Entity<VisitorAttendance>()
                .HasOne(va => va.Visitor)
                .WithMany()
                .HasForeignKey(va => va.VisitorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VisitorAttendance>()
                .HasOne(va => va.ChurchService)
                .WithMany()
                .HasForeignKey(va => va.ChurchServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VisitorAttendance>()
                .HasIndex(va => new
                {
                    va.VisitorId,
                    va.ChurchServiceId
                })
                .IsUnique();

            // =====================================================
            // GIVING
            // =====================================================

            modelBuilder.Entity<Giving>()
                .HasOne(g => g.Member)
                .WithMany()
                .HasForeignKey(g => g.MemberId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Giving>()
                .HasOne(g => g.ChurchService)
                .WithMany()
                .HasForeignKey(g => g.ChurchServiceId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Giving>()
                .Property(g => g.Amount)
                .HasColumnType("decimal(18,2)");

            // =====================================================
            // VISITOR
            // =====================================================

            modelBuilder.Entity<Visitor>()
                .HasIndex(v => v.VisitorCode)
                .IsUnique();

            // =====================================================
            // MINISTRY PERFORMANCE
            // =====================================================

            modelBuilder.Entity<MinistryPerformanceRating>()
                .HasOne(p => p.MinistryMember)
                .WithMany()
                .HasForeignKey(p => p.MinistryMemberId)
                .OnDelete(DeleteBehavior.Cascade);

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
            // PERMISSION → ROLE
            // =====================================================

            modelBuilder.Entity<Permission>()
                .HasOne(p => p.Role)
                .WithMany(r => r.Permissions)
                .HasForeignKey(p => p.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.RoleName)
                .IsUnique();

            modelBuilder.Entity<Permission>()
                .HasIndex(p => new
                {
                    p.RoleId,
                    p.Module
                })
                .IsUnique();

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
            // SUBSCRIPTION PLAN
            // =====================================================

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

            // =====================================================
            // SUBSCRIPTION
            // =====================================================

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

                entity.HasOne(e => e.SubscriptionPlan)
                    .WithMany(p => p.Subscriptions)
                    .HasForeignKey(e => e.SubscriptionPlanId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

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

                entity.HasOne(e => e.Subscription)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(e => e.SubscriptionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.ReferenceNumber);
                entity.HasIndex(e => e.GatewayPaymentId);
                entity.HasIndex(e => e.CreatedDate);
            });

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

            modelBuilder.Entity<CourseEnrollment>()
                .HasIndex(e => new
                {
                    e.CourseId,
                    e.UserId
                })
                .IsUnique();

            modelBuilder.Entity<Certificate>()
                .HasIndex(c => c.CertificateNumber)
                .IsUnique();

            modelBuilder.Entity<LessonProgress>()
                .HasIndex(p => new
                {
                    p.CourseEnrollmentId,
                    p.LessonId
                })
                .IsUnique();

            modelBuilder.Entity<CourseEnrollment>()
                .Property(e => e.ProgressPercentage)
                .HasDefaultValue(0);

            modelBuilder.Entity<LessonProgress>()
                .Property(p => p.ProgressPercentage)
                .HasDefaultValue(0);
        }
    }
}