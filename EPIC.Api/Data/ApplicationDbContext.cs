
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
        // CORE
        // =========================================================

        public DbSet<User> Users => Set<User>();
        public DbSet<Member> Members => Set<Member>();
        public DbSet<ClientMember> ClientMembers { get; set; } = null!;
        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<Income> Incomes => Set<Income>();
        public DbSet<Expense> Expenses => Set<Expense>();

        public DbSet<Visitor> Visitors => Set<Visitor>();
        public DbSet<VisitorAttendance> VisitorAttendances => Set<VisitorAttendance>();
        public DbSet<WebsiteVisit> WebsiteVisits => Set<WebsiteVisit>();

        public DbSet<Ministry> Ministries => Set<Ministry>();
        public DbSet<MinistryMember> MinistryMembers => Set<MinistryMember>();
        public DbSet<MinistryPerformanceRating> MinistryPerformanceRatings
            => Set<MinistryPerformanceRating>();

        public DbSet<ChurchService> ChurchServices => Set<ChurchService>();
        public DbSet<Giving> Givings => Set<Giving>();

        // =========================================================
        // EVENTS
        // =========================================================

        public DbSet<Event> Events => Set<Event>();
        public DbSet<EventDepartment> EventDepartments => Set<EventDepartment>();
        public DbSet<EventRole> EventRoles => Set<EventRole>();
        public DbSet<EventAssignment> EventAssignments => Set<EventAssignment>();
        public DbSet<EventNeed> EventNeeds => Set<EventNeed>();
        public DbSet<EventChecklist> EventChecklists => Set<EventChecklist>();

        // =========================================================
        // SECURITY
        // =========================================================

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();

        // =========================================================
        // CLIENT SECURITY
        // =========================================================

        public DbSet<ClientRole> ClientRoles => Set<ClientRole>();
        public DbSet<ClientPermission> ClientPermissions => Set<ClientPermission>();

        // =========================================================
        // SETTINGS
        // =========================================================

        public DbSet<ChurchSettings> ChurchSettings => Set<ChurchSettings>();
        public DbSet<CRBreakPass> CRBreakPasses => Set<CRBreakPass>();

        // =========================================================
        // SALES / SUBSCRIPTIONS
        // =========================================================

        public DbSet<DemoRequest> DemoRequests => Set<DemoRequest>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<Payment> Payments => Set<Payment>();

        // =========================================================
        // EPIC LEARNING
        // =========================================================

        public DbSet<Course> Courses => Set<Course>();
        public DbSet<CourseModule> CourseModules => Set<CourseModule>();
        public DbSet<Lesson> Lessons => Set<Lesson>();
        public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
        public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
        public DbSet<Certificate> Certificates => Set<Certificate>();

        // =========================================================
        // MODEL CREATION
        // =========================================================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureUsers(modelBuilder);
            ConfigureMembers(modelBuilder);

            ConfigureRoles(modelBuilder);
            ConfigurePermissions(modelBuilder);

            ConfigureClientRoles(modelBuilder);
            ConfigureClientPermissions(modelBuilder);

            ConfigureWebsiteVisits(modelBuilder);

            ConfigureEvents(modelBuilder);

            ConfigureAttendance(modelBuilder);
            ConfigureVisitorAttendance(modelBuilder);
            ConfigureVisitors(modelBuilder);

            ConfigureExpenses(modelBuilder);
            ConfigureIncome(modelBuilder);
            ConfigureGiving(modelBuilder);
            ConfigureChurchServices(modelBuilder);

            ConfigureMinistries(modelBuilder);
            ConfigureMinistryMembers(modelBuilder);
            ConfigureMinistryPerformance(modelBuilder);

            ConfigureChurchSettings(modelBuilder);

            ConfigureDemoRequests(modelBuilder);
            ConfigureCustomers(modelBuilder);
            ConfigureClientMembers(modelBuilder);

            ConfigureSubscriptionPlans(modelBuilder);
            ConfigureSubscriptions(modelBuilder);
            ConfigurePayments(modelBuilder);

            ConfigureLearning(modelBuilder);
        }

        // =========================================================
        // USERS
        // =========================================================

        private static void ConfigureUsers(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);

                entity.Property(e => e.Username)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.PasswordHash)
                    .IsRequired();

                entity.Property(e => e.FullName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.ApprovalStatus)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("APPROVED");

                entity.Property(e => e.IsActive)
                    .IsRequired()
                    .HasDefaultValue(true);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.Username)
                    .IsUnique();

                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.RoleId);
                entity.HasIndex(e => e.ApprovalStatus);
                entity.HasIndex(e => e.IsActive);
            });
        }

        // =========================================================
        // ROLES
        // =========================================================

        private static void ConfigureRoles(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.RoleId);

                entity.Property(e => e.RoleName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.HasIndex(e => e.RoleName)
                    .IsUnique();
            });
        }

        // =========================================================
        // CLIENT ROLES
        // =========================================================

        private static void ConfigureClientRoles(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClientRole>(entity =>
            {
                entity.HasKey(e => e.ClientRoleId);

                entity.Property(e => e.CustomerId)
                    .IsRequired();

                entity.Property(e => e.RoleName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.IsSystemRole)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.IsActive)
                    .IsRequired()
                    .HasDefaultValue(true);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.UpdatedDate)
                    .IsRequired(false);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.CustomerId);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.RoleName
                })
                .IsUnique();
            });
        }

        // =========================================================
        // CLIENT PERMISSIONS
        // =========================================================

        private static void ConfigureClientPermissions(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClientPermission>(entity =>
            {
                entity.HasKey(e => e.ClientPermissionId);

                entity.Property(e => e.ModuleName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.CanView)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CanCreate)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CanEdit)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CanDelete)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CanManage)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.HasOne(e => e.ClientRole)
                    .WithMany(r => r.ClientPermissions)
                    .HasForeignKey(e => e.ClientRoleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new
                {
                    e.ClientRoleId,
                    e.ModuleName
                })
                .IsUnique();
            });
        }

        // =========================================================
        // PERMISSIONS
        // =========================================================

        private static void ConfigurePermissions(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(e => e.PermissionId);

                entity.Property(e => e.Module)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Permissions)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new
                {
                    e.RoleId,
                    e.Module
                })
                .IsUnique();
            });
        }

        // =========================================================
        // WEBSITE ANALYTICS
        // =========================================================

        private static void ConfigureWebsiteVisits(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<WebsiteVisit>(entity =>
            {
                entity.HasKey(e => e.WebsiteVisitId);

                entity.Property(e => e.VisitorId)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.SessionId)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.PageUrl)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(e => e.PagePath)
                    .HasMaxLength(500);

                entity.Property(e => e.PageTitle)
                    .HasMaxLength(200);

                entity.Property(e => e.Referrer)
                    .HasMaxLength(1000);

                entity.Property(e => e.TrafficSource)
                    .HasMaxLength(100);

                entity.Property(e => e.TrafficMedium)
                    .HasMaxLength(100);

                entity.Property(e => e.TrafficCampaign)
                    .HasMaxLength(200);

                entity.Property(e => e.UtmSource)
                    .HasMaxLength(200);

                entity.Property(e => e.UtmMedium)
                    .HasMaxLength(200);

                entity.Property(e => e.UtmCampaign)
                    .HasMaxLength(200);

                entity.Property(e => e.UtmTerm)
                    .HasMaxLength(200);

                entity.Property(e => e.UtmContent)
                    .HasMaxLength(200);

                entity.Property(e => e.DeviceType)
                    .HasMaxLength(50);

                entity.Property(e => e.Browser)
                    .HasMaxLength(100);

                entity.Property(e => e.OperatingSystem)
                    .HasMaxLength(100);

                entity.Property(e => e.ScreenResolution)
                    .HasMaxLength(50);

                entity.Property(e => e.Country)
                    .HasMaxLength(100);

                entity.Property(e => e.Region)
                    .HasMaxLength(100);

                entity.Property(e => e.City)
                    .HasMaxLength(100);

                entity.Property(e => e.UserAgent)
                    .HasMaxLength(1000);

                entity.Property(e => e.Language)
                    .HasMaxLength(100);

                entity.Property(e => e.TimeZone)
                    .HasMaxLength(50);

                entity.HasIndex(e => e.VisitorId);
                entity.HasIndex(e => e.SessionId);
                entity.HasIndex(e => e.VisitedAt);
                entity.HasIndex(e => e.PagePath);
                entity.HasIndex(e => e.TrafficSource);
                entity.HasIndex(e => e.TrafficMedium);
                entity.HasIndex(e => e.UtmCampaign);
                entity.HasIndex(e => e.DeviceType);
                entity.HasIndex(e => e.Country);
            });
        }

        // =========================================================
        // EVENTS
        // =========================================================

        private static void ConfigureEvents(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.EventId);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.Title)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.EventType)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.EventDate)
                    .IsRequired();

                entity.Property(e => e.StartTime)
                    .IsRequired();

                entity.Property(e => e.EndTime)
                    .IsRequired(false);

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

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.EventDate);
                entity.HasIndex(e => e.EventType);
                entity.HasIndex(e => e.Status);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.EventDate
                });
            });

            // =====================================================
            // EVENT DEPARTMENT
            // =====================================================

            modelBuilder.Entity<EventDepartment>(entity =>
            {
                entity.HasKey(e => e.EventDepartmentId);

                entity.HasOne(e => e.Event)
                    .WithMany(e => e.EventDepartments)
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

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.DepartmentHeadMemberId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);

                entity.HasIndex(e => new
                {
                    e.EventId,
                    e.DepartmentName
                })
                .IsUnique();
            });

            // =====================================================
            // EVENT ROLE
            // =====================================================

            modelBuilder.Entity<EventRole>(entity =>
            {
                entity.HasKey(e => e.EventRoleId);

                entity.HasOne(e => e.EventDepartment)
                    .WithMany(d => d.EventRoles)
                    .HasForeignKey(e => e.EventDepartmentId)
                    .OnDelete(DeleteBehavior.Cascade);

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

                entity.Property(e => e.UpdatedAt)
                    .IsRequired(false);

                entity.HasIndex(e => e.EventDepartmentId);
                entity.HasIndex(e => e.RoleName);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);

                entity.HasIndex(e => new
                {
                    e.EventDepartmentId,
                    e.RoleName
                })
                .IsUnique();
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
                    .WithMany(d => d.EventAssignments)
                    .HasForeignKey(e => e.EventDepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.EventRole)
                    .WithMany(r => r.EventAssignments)
                    .HasForeignKey(e => e.EventRoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.AssignedPerson)
                    .HasMaxLength(200);

                entity.Property(e => e.DepartmentName)
                    .HasMaxLength(150);

                entity.Property(e => e.RoleName)
                    .HasMaxLength(150);

                entity.Property(e => e.AssignmentStatus)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("PENDING");

                entity.Property(e => e.Priority)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("NORMAL");

                entity.Property(e => e.Notes);

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
                    .OnDelete(DeleteBehavior.Restrict);

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
                entity.HasIndex(e => e.NeededBy);
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
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CompletedByMember)
                    .WithMany()
                    .HasForeignKey(e => e.CompletedByMemberId)
                    .OnDelete(DeleteBehavior.Restrict);

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
                entity.HasIndex(e => e.DueDate);
            });
        }

    

        // =========================================================
        // ATTENDANCE
        // =========================================================

        private static void ConfigureAttendance(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.HasKey(e => e.AttendanceId);

                // =====================================================
                // MEMBER
                // =====================================================

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // CHURCH SERVICE
                // =====================================================

                entity.HasOne(e => e.ChurchService)
                    .WithMany()
                    .HasForeignKey(e => e.ChurchServiceId)
                    .OnDelete(DeleteBehavior.SetNull);

                // =====================================================
                // EVENT
                // =====================================================

                entity.HasOne(e => e.Event)
                    .WithMany()
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.SetNull);

                // =====================================================
                // UNIQUE MEMBER + CHURCH SERVICE
                // =====================================================

                entity.HasIndex(e => new
                {
                    e.MemberId,
                    e.ChurchServiceId
                })
                .HasFilter("[ChurchServiceId] IS NOT NULL")
                .IsUnique();

                // =====================================================
                // UNIQUE MEMBER + EVENT
                // =====================================================

                entity.HasIndex(e => new
                {
                    e.MemberId,
                    e.EventId
                })
                .HasFilter("[EventId] IS NOT NULL")
                .IsUnique();
            });
        }

        // =========================================================
        // VISITOR ATTENDANCE
        // =========================================================

        private static void ConfigureVisitorAttendance(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VisitorAttendance>(entity =>
            {
                entity.HasKey(e => e.VisitorAttendanceId);

                entity.HasOne(e => e.Visitor)
                    .WithMany(v => v.VisitorAttendances)
                    .HasForeignKey(e => e.VisitorId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ChurchService)
                    .WithMany()
                    .HasForeignKey(e => e.ChurchServiceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.AttendanceDate)
                    .IsRequired();

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("PRESENT");

                entity.Property(e => e.RecordedBy)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.RecordedDate)
                    .IsRequired();

                entity.HasIndex(e => new
                {
                    e.VisitorId,
                    e.ChurchServiceId
                })
                .IsUnique();

                entity.HasIndex(e => e.VisitorId);
                entity.HasIndex(e => e.ChurchServiceId);
                entity.HasIndex(e => e.AttendanceDate);
                entity.HasIndex(e => e.Status);
            });
        }

        // =========================================================
        // VISITORS
        // =========================================================

        private static void ConfigureVisitors(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Visitor>(entity =>
            {
                entity.HasIndex(e => e.VisitorCode)
                    .IsUnique();
            });
        }

        // =========================================================
        // EXPENSES
        // =========================================================

        private static void ConfigureExpenses(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Expense>(entity =>
            {
                // =====================================================
                // PRIMARY KEY
                // =====================================================

                entity.HasKey(e => e.ExpenseId);

                // =====================================================
                // CUSTOMER / TENANT
                // =====================================================

                entity.Property(e => e.CustomerId)
                    .IsRequired();

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // EXPENSE INFORMATION
                // =====================================================

                entity.Property(e => e.Category)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.Property(e => e.ExpenseDate)
                    .IsRequired();

                // =====================================================
                // PAYMENT
                // =====================================================

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.ReferenceNumber)
                    .HasMaxLength(100);

                // =====================================================
                // RECORD INFORMATION
                // =====================================================

                entity.Property(e => e.RecordedBy)
                    .HasMaxLength(150);

                entity.Property(e => e.RecordedDate)
                    .IsRequired();

                // =====================================================
                // INDEXES
                // =====================================================

                entity.HasIndex(e => e.CustomerId);

                entity.HasIndex(e => e.ExpenseDate);

                entity.HasIndex(e => e.Category);

                entity.HasIndex(e => e.PaymentMethod);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.ExpenseDate
                });
            });
        }
        // =========================================================
        // INCOME
        // =========================================================

        private static void ConfigureIncome(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Income>(entity =>
            {
                // =====================================================
                // PRIMARY KEY
                // =====================================================

                entity.HasKey(e => e.IncomeId);

                // =====================================================
                // CUSTOMER / TENANT
                // =====================================================

                entity.Property(e => e.CustomerId)
                    .IsRequired();

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // INCOME INFORMATION
                // =====================================================

                entity.Property(e => e.Category)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(250)
                    .IsRequired();

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.Property(e => e.IncomeDate)
                    .IsRequired();

                // =====================================================
                // PAYMENT
                // =====================================================

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(100);

                entity.Property(e => e.ReferenceNumber)
                    .HasMaxLength(250);

                // =====================================================
                // RECORD INFORMATION
                // =====================================================

                entity.Property(e => e.RecordedBy)
                    .HasMaxLength(150);

                entity.Property(e => e.RecordedDate)
                    .IsRequired();

                // =====================================================
                // INDEXES
                // =====================================================

                entity.HasIndex(e => e.CustomerId);

                entity.HasIndex(e => e.IncomeDate);

                entity.HasIndex(e => e.Category);

                entity.HasIndex(e => e.PaymentMethod);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.IncomeDate
                });
            });
        }
        // =========================================================
        // GIVING
        // =========================================================

        private static void ConfigureGiving(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Giving>(entity =>
            {
                entity.HasKey(e => e.GivingId);

                entity.Property(e => e.CustomerId)
                    .IsRequired();

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ChurchService)
                    .WithMany()
                    .HasForeignKey(e => e.ChurchServiceId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(e => e.GivingType)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.Property(e => e.GivingDate)
                    .IsRequired();

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.ReferenceNumber)
                    .HasMaxLength(100);

                entity.Property(e => e.Notes)
                    .HasMaxLength(500);

                entity.Property(e => e.RecordedBy)
                    .HasMaxLength(100);

                entity.Property(e => e.RecordedDate)
                    .IsRequired();

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.ChurchServiceId);
                entity.HasIndex(e => e.GivingDate);
                entity.HasIndex(e => e.GivingType);
                entity.HasIndex(e => e.PaymentMethod);
            });
        }

        // =========================================================
        // CHURCH SERVICES
        // =========================================================

        private static void ConfigureChurchServices(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChurchService>(entity =>
            {
                entity.HasKey(e => e.ChurchServiceId);

                entity.Property(e => e.CustomerId)
                    .IsRequired();

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.ServiceName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.ServiceType)
                    .HasMaxLength(50);

                entity.Property(e => e.ServiceDate)
                    .IsRequired();

                entity.Property(e => e.StartTime)
                    .HasMaxLength(50);

                entity.Property(e => e.EndTime)
                    .HasMaxLength(50);

                entity.Property(e => e.Location)
                    .HasMaxLength(200);

                entity.Property(e => e.ServiceLeader)
                    .HasMaxLength(150);

                entity.Property(e => e.Speaker)
                    .HasMaxLength(150);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("SCHEDULED");

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.UpdatedDate)
                    .IsRequired(false);

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.ServiceDate);
                entity.HasIndex(e => e.ServiceType);
                entity.HasIndex(e => e.Status);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.ServiceDate
                });
            });
        }

        // =========================================================
        // MEMBERS
        // =========================================================

        private static void ConfigureMembers(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Member>(entity =>
            {
                entity.HasKey(e => e.MemberId);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.MemberCode)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.FirstName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.MiddleName)
                    .HasMaxLength(100);

                entity.Property(e => e.LastName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Gender)
                    .HasMaxLength(30);

                entity.Property(e => e.ContactNumber)
                    .HasMaxLength(50);

                entity.Property(e => e.Address)
                    .HasMaxLength(500);

                entity.Property(e => e.CivilStatus)
                    .HasMaxLength(50);

                entity.Property(e => e.Ministry)
                    .HasMaxLength(150);

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("ACTIVE");

                entity.Property(e => e.PhotoPath)
                    .HasMaxLength(500);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.HasIndex(e => e.CustomerId);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.MemberCode
                })
                .IsUnique();
            });
        }

        // =========================================================
        // MINISTRIES
        // =========================================================

        private static void ConfigureMinistries(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Ministry>(entity =>
            {
                entity.HasKey(e => e.MinistryId);

                // =====================================================
                // CUSTOMER / TENANT
                // =====================================================

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // MINISTRY INFORMATION
                // =====================================================

                entity.Property(e => e.Name)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.MinistryCode)
                    .HasMaxLength(50);

                entity.Property(e => e.MinistryHead)
                    .HasMaxLength(100);

                entity.Property(e => e.ContactNumber)
                    .HasMaxLength(50);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                // =====================================================
                // MEETING INFORMATION
                // =====================================================

                entity.Property(e => e.MeetingDay)
                    .HasMaxLength(50);

                entity.Property(e => e.MeetingTime)
                    .HasMaxLength(50);

                entity.Property(e => e.MeetingLocation)
                    .HasMaxLength(250);

                // =====================================================
                // STATUS
                // =====================================================

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("ACTIVE");

                // =====================================================
                // AUDIT
                // =====================================================

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.UpdatedDate)
                    .IsRequired(false);

                // =====================================================
                // INDEXES
                // =====================================================

                entity.HasIndex(e => e.CustomerId);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.Name
                });
            });
        }

    
// =========================================================
// MINISTRY MEMBERS
// =========================================================

private static void ConfigureMinistryMembers(
    ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MinistryMember>(entity =>
            {
                // =====================================================
                // PRIMARY KEY
                // =====================================================

                entity.HasKey(e => e.MinistryMemberId);

                // =====================================================
                // MINISTRY
                // =====================================================

                entity.HasOne(e => e.Ministry)
                    .WithMany(m => m.MinistryMembers)
                    .HasForeignKey(e => e.MinistryId)
                    .OnDelete(DeleteBehavior.Cascade);

                // =====================================================
                // MEMBER
                // =====================================================

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =====================================================
                // ROLE
                // =====================================================

                entity.Property(e => e.Role)
                    .HasMaxLength(100)
                    .IsRequired(false);

                // =====================================================
                // POSITION
                // =====================================================

                entity.Property(e => e.Position)
                    .HasMaxLength(100)
                    .IsRequired(false);

                // =====================================================
                // STATUS
                // =====================================================

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("ACTIVE");

                // =====================================================
                // NOTES
                // =====================================================

                entity.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .IsRequired(false);

                // =====================================================
                // ASSIGNMENT DATES
                // =====================================================

                entity.Property(e => e.DateAssigned)
                    .IsRequired();

                entity.Property(e => e.DateEnded)
                    .IsRequired(false);

                // =====================================================
                // AUDIT
                // =====================================================

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.UpdatedDate)
                    .IsRequired(false);

                // =====================================================
                // INDEXES
                // =====================================================

                entity.HasIndex(e => e.MinistryId);

                entity.HasIndex(e => e.MemberId);

                entity.HasIndex(e => e.Status);

                // =====================================================
                // UNIQUE MINISTRY MEMBER ASSIGNMENT
                // =====================================================

                entity.HasIndex(e => new
                {
                    e.MinistryId,
                    e.MemberId
                })
                .IsUnique();
            });
        }



        // =========================================================
        // MINISTRY PERFORMANCE
        // =========================================================

        private static void ConfigureMinistryPerformance(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MinistryPerformanceRating>(entity =>
            {
                entity.HasOne(p => p.MinistryMember)
                    .WithMany()
                    .HasForeignKey(p => p.MinistryMemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(p => p.AttendanceRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.CommitmentRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.ParticipationRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.TeamworkRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.SpiritualGrowthRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.LeadershipRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.ResponsibilityRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(p => p.OverallRating)
                    .HasColumnType("decimal(3,2)");

                entity.HasIndex(p => p.MinistryMemberId);
            });
        }

        // =========================================================
        // CHURCH SETTINGS
        // =========================================================

        private static void ConfigureChurchSettings(
            ModelBuilder modelBuilder)
        {
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
        }

        // =========================================================
        // DEMO REQUESTS
        // =========================================================

        private static void ConfigureDemoRequests(
            ModelBuilder modelBuilder)
        {
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
        }

        // =========================================================
        // CUSTOMERS
        // =========================================================

        private static void ConfigureCustomers(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.CustomerId);

                entity.Property(e => e.ChurchName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.ContactPerson)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(e => e.Email)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.Phone)
                    .HasMaxLength(50);

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("Active");

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.UpdatedDate)
                    .IsRequired(false);

                entity.HasOne(e => e.DemoRequest)
                    .WithMany()
                    .HasForeignKey(e => e.DemoRequestId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.DemoRequestId)
                    .IsUnique()
                    .HasFilter("[DemoRequestId] IS NOT NULL");

                entity.HasIndex(e => e.Email);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedDate);
            });
        }

        // =========================================================
        // CLIENT MEMBERS
        // =========================================================

        private static void ConfigureClientMembers(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClientMember>(entity =>
            {
                entity.HasKey(e => e.ClientMemberId);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ClientRole)
                    .WithMany(r => r.ClientMembers)
                    .HasForeignKey(e => e.ClientRoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.ClientRoleId);

                entity.HasIndex(e => new
                {
                    e.CustomerId,
                    e.MemberId
                })
                .IsUnique();

                entity.Property(e => e.Username)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.PasswordHash)
                    .IsRequired();

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .IsRequired()
                    .HasDefaultValue("ACTIVE");

                entity.Property(e => e.IsActive)
                    .IsRequired()
                    .HasDefaultValue(true);

                entity.Property(e => e.CreatedDate)
                    .IsRequired();

                entity.Property(e => e.Email)
                    .HasMaxLength(200);

                entity.Property(e => e.ContactNumber)
                    .HasMaxLength(20);
            });
        }

        // =========================================================
        // SUBSCRIPTION PLANS
        // =========================================================

        private static void ConfigureSubscriptionPlans(
            ModelBuilder modelBuilder)
        {
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
                entity.Property(e => e.IncludesEvents)
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
        }

        // =========================================================
        // SUBSCRIPTIONS
        // =========================================================

        private static void ConfigureSubscriptions(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(e => e.SubscriptionId);

                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.SubscriptionPlan)
                    .WithMany(p => p.Subscriptions)
                    .HasForeignKey(e => e.SubscriptionPlanId)
                    .OnDelete(DeleteBehavior.Restrict);

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

                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.SubscriptionPlanId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.ContactEmail);
                entity.HasIndex(e => e.CreatedDate);
            });
        }

        // =========================================================
        // PAYMENTS
        // =========================================================

        private static void ConfigurePayments(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);

                entity.HasOne(e => e.Subscription)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(e => e.SubscriptionId)
                    .OnDelete(DeleteBehavior.Cascade);

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

                entity.HasIndex(e => e.SubscriptionId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.ReferenceNumber);
                entity.HasIndex(e => e.GatewayPaymentId);
                entity.HasIndex(e => e.CreatedDate);
            });
        }

        // =========================================================
        // EPIC LEARNING
        // =========================================================

        private static void ConfigureLearning(ModelBuilder modelBuilder)
        {
            // =====================================================
            // COURSE
            // =====================================================

            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(e => e.CourseId);
            });

            // =====================================================
            // COURSE MODULE
            // =====================================================

            modelBuilder.Entity<CourseModule>(entity =>
            {
                entity.HasKey(e => e.CourseModuleId);

                entity.HasOne(e => e.Course)
                    .WithMany(c => c.Modules)
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =====================================================
            // LESSON
            // =====================================================

            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.HasKey(e => e.LessonId);

                entity.HasOne(e => e.CourseModule)
                    .WithMany(m => m.Lessons)
                    .HasForeignKey(e => e.CourseModuleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =====================================================
            // COURSE ENROLLMENT
            // =====================================================

            modelBuilder.Entity<CourseEnrollment>(entity =>
            {
                entity.HasKey(e => e.CourseEnrollmentId);

                entity.HasOne(e => e.Course)
                    .WithMany(c => c.Enrollments)
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.ProgressPercentage)
                    .HasDefaultValue(0);

                entity.HasIndex(e => new
                {
                    e.CourseId,
                    e.UserId
                })
                .IsUnique();
            });

            // =====================================================
            // LESSON PROGRESS
            // =====================================================

            modelBuilder.Entity<LessonProgress>(entity =>
            {
                entity.HasKey(e => e.LessonProgressId);

                entity.HasOne(e => e.CourseEnrollment)
                    .WithMany(e => e.LessonProgresses)
                    .HasForeignKey(e => e.CourseEnrollmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Lesson)
                    .WithMany(l => l.ProgressRecords)
                    .HasForeignKey(e => e.LessonId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.ProgressPercentage)
                    .HasDefaultValue(0);

                entity.HasIndex(e => new
                {
                    e.CourseEnrollmentId,
                    e.LessonId
                })
                .IsUnique();
            });

            // =====================================================
            // CERTIFICATE
            // =====================================================

            modelBuilder.Entity<Certificate>(entity =>
            {
                entity.HasKey(e => e.CertificateId);

                entity.HasOne(e => e.Course)
                    .WithMany(c => c.Certificates)
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.CertificateNumber)
                    .IsUnique();
            });
        }
    }
}
