using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Data.Seed
{
    public static class EPICLearningSeeder
    {
        public static async Task SeedAsync(
            ApplicationDbContext context)
        {
            // =====================================================
            // FIND COURSE
            // =====================================================

            var course = await context.Courses
                .FirstOrDefaultAsync(c =>
                    c.Title == "Foundations of Faith");

            if (course == null)
            {
                return;
            }

            // =====================================================
            // FIND OR CREATE MODULE
            // =====================================================

            var module = await context.CourseModules
                .FirstOrDefaultAsync(m =>
                    m.CourseId == course.CourseId &&
                    m.Title == "Foundations of Faith");

            if (module == null)
            {
                module = new CourseModule
                {
                    CourseId = course.CourseId,
                    Title = "Foundations of Faith",
                    Description =
                        "Build a strong biblical foundation for your Christian life.",
                    SortOrder = 1
                };

                context.CourseModules.Add(module);

                await context.SaveChangesAsync();
            }

            // =====================================================
            // LESSON 1
            // =====================================================

            await AddLesson(
                context,
                module,
                1,
                "Why We Need Faith",
                20,
                """
                <h2>Why We Need Faith</h2>

                <p>
                    Faith is one of the most important foundations
                    of the Christian life. As followers of Christ,
                    we are called to trust God even when we cannot
                    see the entire path ahead of us.
                </p>

                <h3>What Is Faith?</h3>

                <p>
                    Faith is trusting God and believing that He is
                    faithful to His promises. Faith is more than
                    simply believing that God exists. It means
                    placing our confidence in Him and choosing to
                    follow Him.
                </p>

                <h3>Why Do We Need Faith?</h3>

                <p>
                    We need faith because our relationship with God
                    is based on trust. There will be moments when
                    circumstances are difficult and answers are not
                    immediately visible.
                </p>

                <p>
                    Faith allows us to continue trusting God even
                    during those moments.
                </p>

                <h3>Faith During Difficult Times</h3>

                <p>
                    Difficult circumstances do not mean that God
                    has abandoned us. Faith reminds us that God
                    remains faithful even when our circumstances
                    change.
                </p>

                <h3>Key Scripture</h3>

                <blockquote>
                    Hebrews 11:1
                </blockquote>

                <p>
                    Faith gives us confidence in what we hope for
                    and assurance concerning things we cannot yet
                    see.
                </p>

                <h3>Key Takeaways</h3>

                <ul>
                    <li>Faith is foundational to the Christian life.</li>
                    <li>Faith means trusting God and His promises.</li>
                    <li>Faith helps us follow God even when we cannot see the outcome.</li>
                    <li>Faith gives us strength during difficult circumstances.</li>
                </ul>

                <h3>Reflection</h3>

                <p>
                    What area of your life is God asking you to trust
                    Him with today?
                </p>

                <p>
                    Take a few moments to pray and surrender that
                    area to God.
                </p>
                """,
                "https://www.youtube.com/embed/dQw4w9WgXcQ"
            );

            // =====================================================
            // LESSON 2
            // =====================================================

            await AddLesson(
                context,
                module,
                2,
                "What Is Faith?",
                20,
                """
                <h2>What Is Faith?</h2>

                <p>
                    Faith is confidence in God, His character,
                    His Word, and His promises.
                </p>

                <h3>Faith Is Trust</h3>

                <p>
                    Biblical faith involves trusting God even when
                    we do not understand everything that is happening.
                </p>

                <p>
                    Faith says:
                    <strong>"God is faithful, therefore I can trust Him."</strong>
                </p>

                <h3>Faith Is Action</h3>

                <p>
                    True faith produces action. When we believe God,
                    our decisions begin to reflect that belief.
                </p>

                <h3>Key Scripture</h3>

                <blockquote>
                    2 Corinthians 5:7
                </blockquote>

                <p>
                    We are called to walk by faith rather than by
                    what we can see.
                </p>

                <h3>Key Takeaways</h3>

                <ul>
                    <li>Faith means trusting God.</li>
                    <li>Faith affects our decisions.</li>
                    <li>Faith produces obedience.</li>
                    <li>Faith grows as we learn to depend on God.</li>
                </ul>

                <h3>Reflection</h3>

                <p>
                    Is there something God has asked you to do that
                    requires you to trust Him?
                </p>
                """,
                null
            );

            // =====================================================
            // LESSON 3
            // =====================================================

            await AddLesson(
                context,
                module,
                3,
                "Faith Comes by Hearing",
                20,
                """
                <h2>Faith Comes by Hearing</h2>

                <p>
                    Our faith grows when we continually hear,
                    study, and meditate on the Word of God.
                </p>

                <h3>The Word Builds Faith</h3>

                <p>
                    God's Word teaches us who He is and reminds us
                    of His promises.
                </p>

                <h3>Make God's Word Part of Your Life</h3>

                <ul>
                    <li>Read Scripture regularly.</li>
                    <li>Listen carefully to biblical teaching.</li>
                    <li>Meditate on God's promises.</li>
                    <li>Apply what you learn.</li>
                </ul>

                <h3>Key Scripture</h3>

                <blockquote>
                    Romans 10:17
                </blockquote>

                <p>
                    Faith grows as we hear and receive the message
                    of Christ.
                </p>

                <h3>Reflection</h3>

                <p>
                    How can you create more time in your daily life
                    to hear and study God's Word?
                </p>
                """,
                null
            );

            // =====================================================
            // LESSON 4
            // =====================================================

            await AddLesson(
                context,
                module,
                4,
                "Trusting God in Difficult Times",
                25,
                """
                <h2>Trusting God in Difficult Times</h2>

                <p>
                    Everyone experiences seasons of difficulty.
                    Faith does not promise that we will never face
                    problems. Instead, faith teaches us that God is
                    with us through them.
                </p>

                <h3>God Is Faithful</h3>

                <p>
                    When circumstances are uncertain, God's character
                    remains certain.
                </p>

                <h3>Faith During Trials</h3>

                <ul>
                    <li>Pray instead of giving in to fear.</li>
                    <li>Remember God's promises.</li>
                    <li>Seek wise biblical counsel.</li>
                    <li>Continue obeying God.</li>
                    <li>Trust God's timing.</li>
                </ul>

                <h3>Key Scripture</h3>

                <blockquote>
                    Proverbs 3:5-6
                </blockquote>

                <p>
                    Trust God with your whole heart and acknowledge
                    Him in every area of your life.
                </p>

                <h3>Reflection</h3>

                <p>
                    What difficult situation do you need to place
                    into God's hands?
                </p>
                """,
                null
            );

            // =====================================================
            // LESSON 5
            // =====================================================

            await AddLesson(
                context,
                module,
                5,
                "Walking by Faith",
                20,
                """
                <h2>Walking by Faith</h2>

                <p>
                    Christianity is not only about what we believe.
                    It is also about how we live.
                </p>

                <h3>Faith Changes Our Lifestyle</h3>

                <p>
                    When we trust God, our faith should influence
                    our choices, relationships, priorities, and
                    service.
                </p>

                <h3>Faith and Obedience</h3>

                <p>
                    Obedience is one of the ways we demonstrate
                    genuine faith.
                </p>

                <ul>
                    <li>Trust God.</li>
                    <li>Obey His Word.</li>
                    <li>Serve others.</li>
                    <li>Remain faithful.</li>
                    <li>Keep growing spiritually.</li>
                </ul>

                <h3>Key Scripture</h3>

                <blockquote>
                    2 Corinthians 5:7
                </blockquote>

                <h3>Reflection</h3>

                <p>
                    What decision can you make today that demonstrates
                    your trust in God?
                </p>
                """,
                null
            );

            // =====================================================
            // LESSON 6
            // =====================================================

            await AddLesson(
                context,
                module,
                6,
                "Growing Stronger in Faith",
                25,
                """
                <h2>Growing Stronger in Faith</h2>

                <p>
                    Faith is not meant to remain at the same level.
                    God desires us to continually grow spiritually.
                </p>

                <h3>Ways to Grow Your Faith</h3>

                <ul>
                    <li>Spend time in God's Word.</li>
                    <li>Develop a consistent prayer life.</li>
                    <li>Participate in Christian fellowship.</li>
                    <li>Serve others.</li>
                    <li>Practice obedience.</li>
                    <li>Remember God's faithfulness.</li>
                </ul>

                <h3>Keep Growing</h3>

                <p>
                    Spiritual growth takes time. Every step of
                    obedience strengthens our relationship with God.
                </p>

                <h3>Key Scripture</h3>

                <blockquote>
                    2 Peter 3:18
                </blockquote>

                <p>
                    Continue growing in the grace and knowledge of
                    Jesus Christ.
                </p>

                <h3>Final Reflection</h3>

                <p>
                    What is one practical step you will take this
                    week to strengthen your faith?
                </p>

                <h3>Congratulations!</h3>

                <p>
                    You have completed the Foundations of Faith
                    lessons. Continue growing, continue learning,
                    and continue walking with Christ.
                </p>
                """,
                null
            );

            await context.SaveChangesAsync();
        }

        // =========================================================
        // ADD LESSON
        // =========================================================

        private static async Task AddLesson(
            ApplicationDbContext context,
            CourseModule module,
            int sortOrder,
            string title,
            int estimatedMinutes,
            string content,
            string? videoUrl)
        {
            var exists =
                await context.Lessons.AnyAsync(l =>
                    l.CourseModuleId ==
                    module.CourseModuleId &&
                    l.SortOrder ==
                    sortOrder);

            if (exists)
            {
                return;
            }

            context.Lessons.Add(
                new Lesson
                {
                    CourseModuleId =
                        module.CourseModuleId,

                    Title =
                        title,

                    Content =
                        content,

                    VideoUrl =
                        videoUrl,

                    ResourceUrl =
                        null,

                    SortOrder =
                        sortOrder,

                    EstimatedMinutes =
                        estimatedMinutes,

                    IsPublished =
                        true,

                    IsFreePreview =
                        sortOrder == 1,

                    CreatedDate =
                        DateTime.UtcNow
                }
            );
        }
    }
}