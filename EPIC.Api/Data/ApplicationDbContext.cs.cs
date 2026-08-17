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


            // =========================================================
            // EPIC LEARNING
            // =========================================================


            // =====================================================
            // COURSE → MODULES
            // =====================================================

            modelBuilder.Entity<CourseModule>()
                .HasOne(m => m.Course)
                .WithMany(c => c.Modules)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // MODULE → LESSONS
            // =====================================================

            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.CourseModule)
                .WithMany(m => m.Lessons)
                .HasForeignKey(l => l.CourseModuleId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // COURSE → ENROLLMENTS
            // =====================================================

            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // USER → ENROLLMENTS
            // =====================================================

            modelBuilder.Entity<CourseEnrollment>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // ENROLLMENT → LESSON PROGRESS
            // =====================================================

            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.CourseEnrollment)
                .WithMany(e => e.LessonProgresses)
                .HasForeignKey(p => p.CourseEnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // LESSON → PROGRESS
            // =====================================================

            modelBuilder.Entity<LessonProgress>()
                .HasOne(p => p.Lesson)
                .WithMany(l => l.ProgressRecords)
                .HasForeignKey(p => p.LessonId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // COURSE → CERTIFICATES
            // =====================================================

            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Course)
                .WithMany(c => c.Certificates)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // USER → CERTIFICATES
            // =====================================================

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


            // =========================================================
            // EPIC LEARNING SEED
            //
            // COURSE ID = 1
            //
            // 10 MODULES
            // 6 LESSONS EACH
            // TOTAL = 60 LESSONS
            // =========================================================


            // IMPORTANT:
            // Fixed date for EF Core HasData.
            // Do NOT use DateTime.UtcNow here.
            var seedDate =
                new DateTime(
                    2026,
                    8,
                    13,
                    0,
                    0,
                    0,
                    DateTimeKind.Utc);


            // =========================================================
            // MODULES
            // =========================================================

            var modules = new[]
            {
                new CourseModule
                {
                    CourseModuleId = 1,
                    CourseId = 1,
                    Title = "Foundations of Faith",
                    Description =
                        "Understanding the basic foundations of Christian faith and discipleship.",
                    SortOrder = 1,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 2,
                    CourseId = 1,
                    Title = "Knowing God",
                    Description =
                        "Discovering God's character, nature, and relationship with His people.",
                    SortOrder = 2,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 3,
                    CourseId = 1,
                    Title = "Knowing Jesus Christ",
                    Description =
                        "Understanding the person, ministry, death, resurrection, and lordship of Jesus Christ.",
                    SortOrder = 3,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 4,
                    CourseId = 1,
                    Title = "The Holy Spirit",
                    Description =
                        "Learning about the Holy Spirit and His work in the life of every believer.",
                    SortOrder = 4,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 5,
                    CourseId = 1,
                    Title = "The Word of God",
                    Description =
                        "Developing a strong relationship with Scripture and learning how to apply God's Word.",
                    SortOrder = 5,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 6,
                    CourseId = 1,
                    Title = "Prayer and Spiritual Growth",
                    Description =
                        "Developing a consistent prayer life and growing spiritually through fellowship with God.",
                    SortOrder = 6,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 7,
                    CourseId = 1,
                    Title = "Christian Character",
                    Description =
                        "Developing Christlike character, attitudes, values, and behavior.",
                    SortOrder = 7,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 8,
                    CourseId = 1,
                    Title = "Serving Others",
                    Description =
                        "Discovering the biblical calling to serve God, the church, and other people.",
                    SortOrder = 8,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 9,
                    CourseId = 1,
                    Title = "Sharing Your Faith",
                    Description =
                        "Learning how to communicate the Gospel and become a faithful witness for Christ.",
                    SortOrder = 9,
                    IsPublished = true
                },

                new CourseModule
                {
                    CourseModuleId = 10,
                    CourseId = 1,
                    Title = "Living as a Disciple",
                    Description =
                        "Putting discipleship into practice and living a Christ-centered life every day.",
                    SortOrder = 10,
                    IsPublished = true
                }
            };


            modelBuilder.Entity<CourseModule>()
                .HasData(modules);


            // =========================================================
            // LESSON HELPER
            // =========================================================

            var lessons = new List<Lesson>();

            void AddLesson(
                int id,
                int moduleId,
                int sortOrder,
                string title,
                string description,
                string content,
                int minutes)
            {
                lessons.Add(
                    new Lesson
                    {
                        LessonId = id,

                        CourseModuleId = moduleId,

                        Title = title,

                        Content =
                            $"DESCRIPTION:\n{description}\n\n" +
                            $"LESSON CONTENT:\n{content}",

                        SortOrder = sortOrder,

                        EstimatedMinutes = minutes,

                        IsPublished = true,

                        IsFreePreview =
                            sortOrder == 1,

                        CreatedDate = seedDate,

                        UpdatedDate = null
                    });
            }


            // =========================================================
            // MODULE 1
            // FOUNDATIONS OF FAITH
            // =========================================================

            AddLesson(
                1,
                1,
                1,
                "What Is Christian Discipleship?",
                "Understanding the meaning and purpose of Christian discipleship.",
                "Christian discipleship is the lifelong process of following Jesus Christ, learning His teachings, becoming more like Him, and helping others follow Him.",
                20);

            AddLesson(
                2,
                1,
                2,
                "What Does It Mean to Follow Jesus?",
                "Exploring what it means to surrender our lives to Christ.",
                "Following Jesus means placing Him at the center of our lives. It involves trusting Him, obeying His teachings, denying ourselves, and choosing His ways over our own desires.",
                20);

            AddLesson(
                3,
                1,
                3,
                "Salvation by Grace",
                "Understanding salvation as God's gift through faith in Jesus Christ.",
                "Salvation is not earned through human achievement. God's grace provides forgiveness and new life through faith in Jesus Christ.",
                25);

            AddLesson(
                4,
                1,
                4,
                "Faith and Trust in God",
                "Learning how genuine faith affects our daily lives.",
                "Biblical faith involves trusting God even when circumstances are difficult or the future is uncertain.",
                20);

            AddLesson(
                5,
                1,
                5,
                "Repentance and New Life",
                "Understanding biblical repentance and transformation.",
                "Repentance involves turning away from sin and turning toward God. True repentance produces a changed direction and a desire to live according to God's will.",
                25);

            AddLesson(
                6,
                1,
                6,
                "The Cost of Discipleship",
                "Understanding commitment, sacrifice, and obedience in following Christ.",
                "Jesus called His followers to deny themselves, take up their cross, and follow Him. Discipleship requires commitment and surrender.",
                25);


            // =========================================================
            // MODULE 2
            // KNOWING GOD
            // =========================================================

            AddLesson(
                7,
                2,
                1,
                "Who Is God?",
                "Understanding the biblical revelation of God.",
                "God is the Creator, Sustainer, and Lord of all creation. Scripture reveals Him as holy, righteous, loving, faithful, and sovereign.",
                20);

            AddLesson(
                8,
                2,
                2,
                "The Character of God",
                "Exploring God's attributes and character.",
                "God's character includes holiness, justice, mercy, love, faithfulness, wisdom, and goodness.",
                25);

            AddLesson(
                9,
                2,
                3,
                "God's Love",
                "Discovering the depth of God's love for humanity.",
                "God's love is demonstrated throughout Scripture and especially through Jesus Christ.",
                20);

            AddLesson(
                10,
                2,
                4,
                "God's Faithfulness",
                "Learning to trust God's promises.",
                "God remains faithful even when people are inconsistent. His promises provide believers with confidence and hope.",
                20);

            AddLesson(
                11,
                2,
                5,
                "God's Will",
                "Learning to seek and follow God's will.",
                "Christians are called to seek God's will through Scripture, prayer, wisdom, and obedience.",
                25);

            AddLesson(
                12,
                2,
                6,
                "Worshiping God",
                "Understanding worship as a lifestyle.",
                "Worship involves honoring God with our hearts, words, actions, relationships, work, and entire lives.",
                20);


            // =========================================================
            // MODULE 3
            // KNOWING JESUS CHRIST
            // =========================================================

            AddLesson(
                13,
                3,
                1,
                "Who Is Jesus?",
                "Understanding the identity and significance of Jesus Christ.",
                "Jesus Christ is the central person of the Christian faith. The Gospels reveal Him as the Son of God, Savior, Teacher, Lord, and Messiah.",
                25);

            AddLesson(
                14,
                3,
                2,
                "The Ministry of Jesus",
                "Exploring the earthly ministry of Christ.",
                "Jesus proclaimed God's kingdom, taught truth, healed the sick, showed compassion, and called people to follow Him.",
                25);

            AddLesson(
                15,
                3,
                3,
                "The Teachings of Jesus",
                "Learning the central teachings of Christ.",
                "Jesus taught His followers to love God, love others, forgive, serve, pray, remain faithful, and seek God's kingdom.",
                25);

            AddLesson(
                16,
                3,
                4,
                "The Cross of Christ",
                "Understanding the significance of Jesus' death.",
                "The cross stands at the center of the Gospel message. Jesus willingly gave Himself for humanity.",
                25);

            AddLesson(
                17,
                3,
                5,
                "The Resurrection",
                "Understanding the importance of Christ's resurrection.",
                "The resurrection of Jesus is foundational to Christian faith. Christ conquered death and demonstrated His victory.",
                25);

            AddLesson(
                18,
                3,
                6,
                "Jesus as Lord",
                "Understanding the authority and lordship of Christ.",
                "Calling Jesus Lord means recognizing His authority over our lives and surrendering our decisions, priorities, relationships, and future to Him.",
                20);


            // =========================================================
            // MODULE 4
            // THE HOLY SPIRIT
            // =========================================================

            AddLesson(
                19,
                4,
                1,
                "Who Is the Holy Spirit?",
                "Understanding the person and identity of the Holy Spirit.",
                "The Holy Spirit is the Spirit of God who works in believers and guides them into truth.",
                20);

            AddLesson(
                20,
                4,
                2,
                "The Work of the Holy Spirit",
                "Learning how the Holy Spirit works in believers.",
                "The Holy Spirit convicts, teaches, guides, strengthens, comforts, and transforms believers.",
                25);

            AddLesson(
                21,
                4,
                3,
                "Walking in the Spirit",
                "Learning how to live under the guidance of the Holy Spirit.",
                "Walking in the Spirit involves daily dependence upon God, obedience to His Word, and allowing the Spirit to shape our thoughts and actions.",
                20);

            AddLesson(
                22,
                4,
                4,
                "The Fruit of the Spirit",
                "Understanding Christlike character produced by the Spirit.",
                "The fruit of the Spirit describes qualities such as love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.",
                25);

            AddLesson(
                23,
                4,
                5,
                "Spiritual Gifts",
                "Understanding how God equips believers for ministry.",
                "God gives spiritual gifts for strengthening the church and serving others.",
                25);

            AddLesson(
                24,
                4,
                6,
                "Being Filled With the Spirit",
                "Learning about continual dependence upon the Holy Spirit.",
                "Christian life and ministry require continual dependence upon the Holy Spirit.",
                20);


            // =========================================================
            // MODULE 5
            // THE WORD OF GOD
            // =========================================================

            AddLesson(
                25,
                5,
                1,
                "Why the Bible Matters",
                "Understanding the importance of Scripture.",
                "The Bible reveals God's truth and provides guidance for faith and life.",
                20);

            AddLesson(
                26,
                5,
                2,
                "Reading the Bible",
                "Developing a consistent habit of Scripture reading.",
                "Effective Bible reading requires consistency, attention, prayer, and a willingness to understand and apply what God reveals.",
                20);

            AddLesson(
                27,
                5,
                3,
                "Studying Scripture",
                "Learning how to study God's Word carefully.",
                "Bible study involves observing the text, understanding its context, identifying its message, and applying its principles.",
                25);

            AddLesson(
                28,
                5,
                4,
                "Meditating on God's Word",
                "Learning to reflect deeply on Scripture.",
                "Biblical meditation involves intentionally reflecting on God's Word and allowing its truth to shape our thoughts and actions.",
                20);

            AddLesson(
                29,
                5,
                5,
                "Applying Scripture",
                "Moving from Bible knowledge to obedience.",
                "The goal of Scripture is not merely information but transformation. Disciples should apply biblical truth to daily life.",
                25);

            AddLesson(
                30,
                5,
                6,
                "Living by the Word",
                "Building a life guided by Scripture.",
                "A disciple grows stronger by building life upon God's Word.",
                20);


            // =========================================================
            // MODULE 6
            // PRAYER AND SPIRITUAL GROWTH
            // =========================================================

            AddLesson(
                31,
                6,
                1,
                "What Is Prayer?",
                "Understanding prayer as communication and fellowship with God.",
                "Prayer is an essential part of the believer's relationship with God. Through prayer we worship, confess, give thanks, ask for help, intercede, and seek guidance.",
                20);

            AddLesson(
                32,
                6,
                2,
                "The Lord's Prayer",
                "Learning principles of prayer from Jesus' teaching.",
                "Jesus provided a model for prayer that emphasizes God's holiness, God's kingdom, daily provision, forgiveness, and dependence upon Him.",
                25);

            AddLesson(
                33,
                6,
                3,
                "Praying With Faith",
                "Understanding faith and confidence in prayer.",
                "Faith-filled prayer trusts God's character and wisdom while remaining surrendered to His will.",
                20);

            AddLesson(
                34,
                6,
                4,
                "Intercessory Prayer",
                "Learning to pray for other people and situations.",
                "Intercession involves bringing the needs of others before God and is an important expression of Christian love.",
                20);

            AddLesson(
                35,
                6,
                5,
                "Fasting and Prayer",
                "Understanding fasting as a spiritual discipline.",
                "Fasting can help believers focus their attention on God, seek His direction, and deepen their dependence upon Him.",
                25);

            AddLesson(
                36,
                6,
                6,
                "Developing a Prayer Life",
                "Creating a sustainable lifestyle of prayer.",
                "A healthy prayer life grows through consistency and intentional times of fellowship with God.",
                25);


            // =========================================================
            // MODULE 7
            // CHRISTIAN CHARACTER
            // =========================================================

            AddLesson(
                37,
                7,
                1,
                "Becoming Like Christ",
                "Understanding spiritual transformation.",
                "Christian maturity involves becoming increasingly like Jesus in character, attitudes, relationships, and actions.",
                20);

            AddLesson(
                38,
                7,
                2,
                "Humility",
                "Learning the importance of humility in Christian life.",
                "Humility recognizes our dependence upon God and values others.",
                20);

            AddLesson(
                39,
                7,
                3,
                "Integrity",
                "Developing honesty and consistency.",
                "Integrity means living consistently with biblical values even when nobody is watching.",
                20);

            AddLesson(
                40,
                7,
                4,
                "Forgiveness",
                "Learning to forgive others as Christ forgives us.",
                "Forgiveness releases resentment and reflects God's grace.",
                25);

            AddLesson(
                41,
                7,
                5,
                "Love and Compassion",
                "Developing Christlike love toward others.",
                "Christian love is demonstrated through action, care, compassion, dignity, and grace.",
                20);

            AddLesson(
                42,
                7,
                6,
                "Self-Control",
                "Learning discipline and wise choices.",
                "Self-control enables believers to manage desires, emotions, words, and actions in ways that honor God.",
                20);


            // =========================================================
            // MODULE 8
            // SERVING OTHERS
            // =========================================================

            AddLesson(
                43,
                8,
                1,
                "Called to Serve",
                "Understanding the biblical calling to Christian service.",
                "Jesus demonstrated servant leadership and called His followers to serve others.",
                20);

            AddLesson(
                44,
                8,
                2,
                "Serving in the Church",
                "Discovering opportunities for ministry within the church.",
                "Every believer can contribute to the life and mission of the church through teaching, administration, worship, hospitality, discipleship, outreach, and practical care.",
                25);

            AddLesson(
                45,
                8,
                3,
                "Servant Leadership",
                "Understanding leadership through service.",
                "Biblical leadership is about influence through example, humility, responsibility, and sacrificial care.",
                25);

            AddLesson(
                46,
                8,
                4,
                "Using Your Gifts",
                "Discovering and using God-given abilities.",
                "Believers should use their abilities and spiritual gifts to strengthen others and advance God's purposes.",
                20);

            AddLesson(
                47,
                8,
                5,
                "Serving With Excellence",
                "Learning to serve faithfully and responsibly.",
                "Christian service should be carried out with diligence, humility, excellence, and faithfulness.",
                20);

            AddLesson(
                48,
                8,
                6,
                "Serving With Love",
                "Keeping love at the center of Christian ministry.",
                "Effective Christian service combines faithfulness with genuine love and concern for people.",
                20);


            // =========================================================
            // MODULE 9
            // SHARING YOUR FAITH
            // =========================================================

            AddLesson(
                49,
                9,
                1,
                "What Is the Gospel?",
                "Understanding the central message of Christianity.",
                "The Gospel is the good news of what God has done through Jesus Christ. It announces salvation, forgiveness, reconciliation, and new life through Christ.",
                25);

            AddLesson(
                50,
                9,
                2,
                "Your Personal Testimony",
                "Learning how to share your story of faith.",
                "A personal testimony explains how God has worked in your life and can help others understand the transforming power of Christ.",
                20);

            AddLesson(
                51,
                9,
                3,
                "Sharing the Gospel Clearly",
                "Learning to communicate the Gospel simply and faithfully.",
                "Effective evangelism communicates God's truth clearly while treating people with respect, patience, compassion, and love.",
                25);

            AddLesson(
                52,
                9,
                4,
                "Building Relationships",
                "Understanding relational evangelism.",
                "Genuine care and friendship can create opportunities for meaningful conversations about faith.",
                20);

            AddLesson(
                53,
                9,
                5,
                "Answering Questions About Faith",
                "Learning to respond to questions with wisdom and grace.",
                "Christians should be prepared to explain their hope while remaining humble and respectful.",
                25);

            AddLesson(
                54,
                9,
                6,
                "Making Disciples",
                "Understanding the mission to make disciples.",
                "Christian mission goes beyond making converts. Jesus commanded His followers to make disciples who learn, obey, grow, and help others follow Him.",
                25);


            // =========================================================
            // MODULE 10
            // LIVING AS A DISCIPLE
            // =========================================================

            AddLesson(
                55,
                10,
                1,
                "A Christ-Centered Life",
                "Learning to make Christ the center of everyday life.",
                "A Christ-centered life allows Jesus to shape priorities, relationships, decisions, goals, and values.",
                20);

            AddLesson(
                56,
                10,
                2,
                "Faith in Everyday Life",
                "Applying Christian faith to ordinary situations.",
                "Work, family, friendships, finances, responsibilities, and decisions can all become opportunities to demonstrate faithfulness to God.",
                25);

            AddLesson(
                57,
                10,
                3,
                "Overcoming Spiritual Challenges",
                "Learning to remain faithful during difficult seasons.",
                "Every believer experiences challenges, temptation, discouragement, and uncertainty. Spiritual strength grows through prayer, Scripture, fellowship, obedience, and dependence upon God.",
                25);

            AddLesson(
                58,
                10,
                4,
                "Growing in Community",
                "Understanding the importance of Christian fellowship.",
                "Believers were designed to grow together. Christian community provides encouragement, accountability, teaching, prayer, correction, and opportunities for service.",
                20);

            AddLesson(
                59,
                10,
                5,
                "Finishing Faithfully",
                "Learning the importance of perseverance.",
                "Christian discipleship is a lifelong journey. Faithfulness requires perseverance, especially when circumstances are difficult.",
                25);

            AddLesson(
                60,
                10,
                6,
                "Your Discipleship Commitment",
                "Creating a personal commitment to continue following Christ.",
                "Discipleship is a lifelong commitment to Jesus Christ. A mature disciple continues learning, growing, serving, sharing the Gospel, and helping others become disciples.",
                25);


            // =========================================================
            // SEED LESSONS
            // =========================================================

            modelBuilder.Entity<Lesson>()
                .HasData(lessons.ToArray());
        }
    }
}