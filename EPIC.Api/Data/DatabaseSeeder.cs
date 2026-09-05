﻿using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Data
{
    public static class DatabaseSeeder
    {


        // =============================================================
        // SUBSCRIPTION PLANS
        // =============================================================

        public static async Task SeedSubscriptionPlansAsync(
            ApplicationDbContext context)
        {
            var plans = new[]
            {
                new SubscriptionPlan
                {
                    PlanName = "EPIC Starter",
                    Description = "Essential church management tools for growing churches.",
                    MonthlyPrice = 999m,
                    AnnualPrice = 9990m,
                    TrialDays = 0,
                    MaxUsers = 5,
                    MaxMembers = 500,
                    IncludesChurchManagement = true,
                    IncludesAttendance = true,
                    IncludesGiving = true,
                    IncludesFinance = true,
                    IncludesMinistries = true,
                    IncludesEvents = true,
                    IncludesEPICLearning = false,
                    IncludesReports = true,
                    IsActive = true,
                    SortOrder = 1
                },
                new SubscriptionPlan
                {
                    PlanName = "EPIC Growth",
                    Description = "The complete church management solution for active ministries.",
                    MonthlyPrice = 1999m,
                    AnnualPrice = 19990m,
                    TrialDays = 0,
                    MaxUsers = 10,
                    MaxMembers = 2000,
                    IncludesChurchManagement = true,
                    IncludesAttendance = true,
                    IncludesGiving = true,
                    IncludesFinance = true,
                    IncludesMinistries = true,
                    IncludesEvents = true,
                    IncludesEPICLearning = true,
                    IncludesReports = true,
                    IsActive = true,
                    SortOrder = 2
                },
                new SubscriptionPlan
                {
                    PlanName = "EPIC Complete",
                    Description = "The full digital church ecosystem with discipleship and advanced tools.",
                    MonthlyPrice = 2999m,
                    AnnualPrice = 29990m,
                    TrialDays = 0,
                    MaxUsers = 25,
                    MaxMembers = 5000,
                    IncludesChurchManagement = true,
                    IncludesAttendance = true,
                    IncludesGiving = true,
                    IncludesFinance = true,
                    IncludesMinistries = true,
                    IncludesEvents = true,
                    IncludesEPICLearning = true,
                    IncludesReports = true,
                    IsActive = true,
                    SortOrder = 3
                }
            };

            foreach (var seed in plans)
            {
                var existing = await context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.PlanName.ToLower() == seed.PlanName.ToLower());

                if (existing == null)
                {
                    seed.CreatedDate = DateTime.UtcNow;
                    context.SubscriptionPlans.Add(seed);
                    Console.WriteLine($"Created subscription plan: {seed.PlanName}");
                }
                else
                {
                    // Keep existing production pricing/configuration intact.
                    Console.WriteLine($"Subscription plan already exists: {existing.PlanName}");
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task SeedCourse1Async(
            ApplicationDbContext context)
        {
            // =========================================================
            // COURSE
            // =========================================================

            var course = await context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == 1);

            if (course == null)
            {
                Console.WriteLine(
                    "CourseId 1 was not found. Course seed skipped.");

                return;
            }

            Console.WriteLine(
                $"Seeding lessons for Course 1: {course.Title}");

            // =========================================================
            // MODULE DATA
            // =========================================================

            var modules = new[]
            {
                new ModuleSeed
                {
                    SortOrder = 1,
                    Title = "Foundations of Faith",
                    Description =
                        "Understanding the essential foundations of Christian faith and discipleship."
                },

                new ModuleSeed
                {
                    SortOrder = 2,
                    Title = "Knowing God",
                    Description =
                        "Discovering who God is, His character, and how believers can know Him personally."
                },

                new ModuleSeed
                {
                    SortOrder = 3,
                    Title = "Knowing Jesus Christ",
                    Description =
                        "Exploring the person, work, identity, death, resurrection, and lordship of Jesus Christ."
                },

                new ModuleSeed
                {
                    SortOrder = 4,
                    Title = "The Holy Spirit",
                    Description =
                        "Understanding the person and work of the Holy Spirit in the life of a believer."
                },

                new ModuleSeed
                {
                    SortOrder = 5,
                    Title = "The Word of God",
                    Description =
                        "Learning how to understand, study, apply, and live according to God's Word."
                },

                new ModuleSeed
                {
                    SortOrder = 6,
                    Title = "Prayer and Spiritual Growth",
                    Description =
                        "Developing a consistent prayer life and growing deeper in relationship with God."
                },

                new ModuleSeed
                {
                    SortOrder = 7,
                    Title = "Christian Character",
                    Description =
                        "Developing Christlike character, integrity, obedience, love, humility, and holiness."
                },

                new ModuleSeed
                {
                    SortOrder = 8,
                    Title = "Life in the Church",
                    Description =
                        "Understanding Christian fellowship, worship, service, community, and accountability."
                },

                new ModuleSeed
                {
                    SortOrder = 9,
                    Title = "Sharing the Gospel",
                    Description =
                        "Learning how to communicate the Gospel and become an effective witness for Christ."
                },

                new ModuleSeed
                {
                    SortOrder = 10,
                    Title = "Living as a Disciple",
                    Description =
                        "Putting discipleship into practice through mission, service, leadership, and lifelong growth."
                }
            };

            // =========================================================
            // CREATE / FIND MODULES
            // =========================================================

            var moduleEntities =
                new Dictionary<int, CourseModule>();

            foreach (var moduleSeed in modules)
            {
                var module = await context.CourseModules
                    .FirstOrDefaultAsync(m =>
                        m.CourseId == course.CourseId &&
                        m.SortOrder == moduleSeed.SortOrder);

                if (module == null)
                {
                    module = new CourseModule
                    {
                        CourseId = course.CourseId,
                        Title = moduleSeed.Title,
                        Description = moduleSeed.Description,
                        SortOrder = moduleSeed.SortOrder,
                        IsPublished = true
                    };

                    context.CourseModules.Add(module);

                    await context.SaveChangesAsync();

                    Console.WriteLine(
                        $"Created Module {module.SortOrder}: {module.Title}");
                }
                else
                {
                    Console.WriteLine(
                        $"Existing Module {module.SortOrder}: {module.Title}");
                }

                moduleEntities[moduleSeed.SortOrder] = module;
            }

            // =========================================================
            // LESSON DATA
            // =========================================================

            var lessonGroups = new Dictionary<int, LessonSeed[]>
            {
                // =====================================================
                // MODULE 1
                // =====================================================
                [1] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "What Is Christian Discipleship?",
                        Content =
                            """
                            Christian discipleship is the lifelong process of following Jesus Christ, learning His teachings, becoming more like Him, and helping others follow Him.

                            A disciple does not simply collect biblical information. A disciple responds to Christ with faith, obedience, love, and a willingness to serve.

                            Discipleship involves knowing Christ, growing in Christ, living according to His Word, and helping others become disciples.

                            Jesus called His followers to make disciples of all nations. Christian discipleship therefore involves both personal spiritual growth and helping others grow in their relationship with Christ.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "The Gospel and Salvation",
                        Content =
                            """
                            The Gospel is the good news of Jesus Christ. Humanity is separated from God by sin, but God demonstrated His love by sending Jesus Christ to save sinners.

                            Salvation is received by grace through faith in Jesus Christ. It is not earned through human achievement.

                            The Gospel calls people to repent, believe in Jesus, receive forgiveness, and begin a new life with God.

                            Understanding the Gospel is essential because discipleship begins with a genuine response to Jesus Christ.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Faith and Trust in God",
                        Content =
                            """
                            Faith means trusting God and relying upon His character and promises.

                            Biblical faith is more than agreeing that God exists. It involves trusting Him enough to follow Him and obey His Word.

                            Faith grows as believers know God's Word, remember His faithfulness, pray, and experience His guidance.

                            A disciple learns to trust God even when circumstances are difficult or the future is uncertain.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Repentance and New Life",
                        Content =
                            """
                            Repentance means turning away from sin and turning toward God.

                            Genuine repentance involves recognizing sin, confessing it before God, turning from sinful ways, and pursuing obedience.

                            Through Christ, believers receive forgiveness and are called to live a transformed life.

                            Repentance is not merely feeling sorry for wrongdoing. It is a change of direction that produces a life increasingly shaped by God's will.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Identity in Christ",
                        Content =
                            """
                            Believers receive a new identity through their relationship with Jesus Christ.

                            In Christ, believers are forgiven, accepted by God, adopted into His family, and called to live as representatives of Christ.

                            Our identity should not be determined primarily by past failures, achievements, possessions, or opinions of other people.

                            A disciple learns to see himself or herself according to what God has accomplished through Christ.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Counting the Cost of Following Jesus",
                        Content =
                            """
                            Following Jesus is a lifelong commitment.

                            Jesus taught His followers to count the cost of discipleship. Following Him requires surrender, obedience, perseverance, and willingness to place God's purposes above personal convenience.

                            Discipleship does not promise a life without difficulties. Instead, believers learn to remain faithful to Christ through challenges.

                            A mature disciple understands that following Jesus affects every area of life.
                            """,
                        EstimatedMinutes = 25
                    }
                },

                // =====================================================
                // MODULE 2
                // =====================================================
                [2] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Who Is God?",
                        Content =
                            """
                            God is the Creator, Lord, and sustainer of all creation.

                            Scripture reveals God as holy, righteous, loving, faithful, wise, and sovereign.

                            Knowing God is central to Christian discipleship because discipleship is fundamentally about relationship with God through Jesus Christ.

                            As believers learn God's character, they develop greater confidence in His promises and greater desire to worship Him.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "The Character of God",
                        Content =
                            """
                            God's character provides the foundation for our trust in Him.

                            God is faithful, merciful, just, loving, holy, patient, and trustworthy.

                            Understanding God's character helps believers respond to Him with worship, reverence, confidence, and obedience.

                            Christian maturity includes learning to reflect God's character in our relationships and decisions.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "The Trinity",
                        Content =
                            """
                            Christian teaching describes God as one God who exists eternally as Father, Son, and Holy Spirit.

                            The Father, Son, and Holy Spirit are distinct persons while sharing the one divine nature.

                            The doctrine of the Trinity helps believers understand the biblical revelation of God and His work in creation, salvation, and spiritual transformation.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "God as Creator",
                        Content =
                            """
                            Scripture teaches that God created the heavens, the earth, and all that exists.

                            Creation demonstrates God's power, wisdom, and authority.

                            Because God is the Creator, human beings belong to Him and are accountable to Him.

                            Understanding creation should lead believers toward worship, stewardship, humility, and responsible care for God's creation.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "God's Love and Grace",
                        Content =
                            """
                            God's love is demonstrated throughout Scripture and is supremely revealed through Jesus Christ.

                            Grace means God's undeserved favor and generosity toward humanity.

                            Believers receive grace rather than earning God's acceptance through personal achievement.

                            Understanding God's grace should produce gratitude and encourage believers to extend grace to others.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Trusting God's Faithfulness",
                        Content =
                            """
                            God remains faithful to His character and promises.

                            Circumstances may change, but God's faithfulness provides believers with a firm foundation for hope.

                            Disciples learn to remember God's previous faithfulness and trust Him with present circumstances and future concerns.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 3
                // =====================================================
                [3] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Who Is Jesus Christ?",
                        Content =
                            """
                            Jesus Christ is central to the Christian faith.

                            Scripture presents Jesus as the Son of God, Savior, Lord, and Messiah.

                            Christian discipleship begins and continues with knowing Jesus and responding to His call to follow Him.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "The Incarnation",
                        Content =
                            """
                            The incarnation refers to the Son of God becoming human in Jesus Christ.

                            Jesus entered human history, lived among people, experienced human life, and revealed God to humanity.

                            The incarnation demonstrates God's willingness to come near to humanity and accomplish salvation through Christ.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "The Ministry of Jesus",
                        Content =
                            """
                            Jesus' earthly ministry included teaching, preaching, healing, serving, confronting injustice, and calling people to repentance and faith.

                            His ministry revealed God's kingdom and demonstrated compassion toward people.

                            Disciples learn from Jesus not only by studying His words but also by observing His example of humility and service.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "The Cross of Christ",
                        Content =
                            """
                            The cross stands at the center of the Gospel.

                            Jesus willingly gave His life and suffered death for humanity.

                            The cross demonstrates both the seriousness of sin and the depth of God's love.

                            Christians remember the cross as the decisive work through which Christ accomplished salvation.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "The Resurrection",
                        Content =
                            """
                            The resurrection of Jesus is foundational to Christian faith.

                            Jesus was raised from the dead, demonstrating God's victory over death.

                            The resurrection gives believers hope, confirms Christ's identity, and points toward the future resurrection and eternal life promised to those who belong to Him.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Following Jesus as Lord",
                        Content =
                            """
                            Calling Jesus Lord means recognizing His authority over our lives.

                            Discipleship involves surrendering our plans, values, decisions, and priorities to Christ.

                            Following Jesus means learning to obey His teachings and represent Him faithfully in everyday life.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 4
                // =====================================================
                [4] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Who Is the Holy Spirit?",
                        Content =
                            """
                            The Holy Spirit is the third person of the Trinity and is fully divine.

                            The Holy Spirit is not merely a force or influence. Scripture presents Him as personal, active, and involved in the life of believers.

                            Understanding the Holy Spirit helps disciples understand God's presence and work in their lives.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "The Holy Spirit and Salvation",
                        Content =
                            """
                            The Holy Spirit is involved in God's work of salvation.

                            The Spirit convicts people of sin, brings new life, and works within believers.

                            Salvation is therefore not simply a change in religious membership but a work of God that transforms the believer.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Walking in the Spirit",
                        Content =
                            """
                            Walking in the Spirit means allowing the Holy Spirit to shape our thoughts, choices, attitudes, and actions.

                            Spirit-led living requires surrender, obedience, prayer, and sensitivity to God's Word.

                            Believers grow as they continually submit their lives to God's direction.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "The Fruit of the Spirit",
                        Content =
                            """
                            The fruit of the Spirit describes Christlike qualities produced in the life of a believer.

                            Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control are evidence of spiritual growth.

                            Spiritual maturity is demonstrated through character, not merely knowledge or religious activity.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Spiritual Gifts",
                        Content =
                            """
                            God gives spiritual gifts for the strengthening and service of His people.

                            Spiritual gifts are intended to build up the church and help accomplish God's purposes.

                            Believers should discover, develop, and use their gifts with humility and love.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Being Led by the Spirit",
                        Content =
                            """
                            Spirit-led discipleship involves learning to recognize God's direction through Scripture, prayer, wisdom, and godly counsel.

                            The Holy Spirit never leads believers contrary to God's revealed Word.

                            Mature disciples learn to respond to God's leading with humility and obedience.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 5
                // =====================================================
                [5] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Why the Bible Matters",
                        Content =
                            """
                            The Bible is foundational to Christian faith and discipleship.

                            Scripture teaches believers about God, salvation, wisdom, righteous living, and God's purposes.

                            A disciple needs regular exposure to God's Word in order to grow spiritually.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "Reading the Bible",
                        Content =
                            """
                            Reading Scripture should be approached with attention, humility, and a desire to understand what God has revealed.

                            Good Bible reading includes observing the text, understanding its context, and considering how its principles apply to life.

                            Consistency is more valuable than simply reading large amounts occasionally.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Understanding Biblical Context",
                        Content =
                            """
                            Biblical passages should be understood in their literary, historical, cultural, and immediate context.

                            Context helps prevent misunderstanding and helps readers recognize the intended meaning of Scripture.

                            Responsible Bible study considers the surrounding passage rather than relying only on isolated verses.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Meditating on God's Word",
                        Content =
                            """
                            Biblical meditation involves thoughtfully reflecting on God's Word and allowing it to shape our thinking.

                            Meditation is not simply emptying the mind. It involves focusing attention on God's truth and considering how it should influence our lives.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Applying Scripture",
                        Content =
                            """
                            Bible study should lead to obedience and transformation.

                            Application means asking what God's Word teaches, what needs to change, and how the truth should be lived out.

                            Knowledge without obedience does not produce mature discipleship.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Building a Daily Bible Habit",
                        Content =
                            """
                            A healthy disciple develops regular habits of reading and studying Scripture.

                            A practical Bible routine should be realistic, consistent, and focused on understanding and application.

                            Small daily steps can develop a lifelong pattern of learning from God's Word.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 6
                // =====================================================
                [6] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Why We Pray",
                        Content =
                            """
                            Prayer is communication and fellowship with God.

                            Christians pray because God invites His people to bring their worship, thanksgiving, concerns, requests, confession, and desires before Him.

                            Prayer strengthens dependence upon God.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "The Lord's Prayer",
                        Content =
                            """
                            Jesus provided a model for prayer that emphasizes God's holiness, God's kingdom, daily dependence, forgiveness, and spiritual protection.

                            The Lord's Prayer teaches disciples that prayer begins with God and His purposes rather than being centered only on personal desires.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Prayer and Thanksgiving",
                        Content =
                            """
                            Thanksgiving is an important part of Christian prayer.

                            Remembering God's goodness develops gratitude and helps believers recognize His work even during difficult seasons.

                            A thankful heart strengthens faith and changes the way believers see circumstances.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Praying for Others",
                        Content =
                            """
                            Intercessory prayer means praying on behalf of other people.

                            Disciples can pray for family members, church leaders, communities, people in need, and those who do not yet know Christ.

                            Intercession expresses love and dependence upon God's power.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Growing Through Spiritual Disciplines",
                        Content =
                            """
                            Spiritual disciplines such as prayer, Scripture reading, worship, fasting, fellowship, and service can help believers create space for spiritual growth.

                            These practices do not earn salvation. Instead, they help disciples cultivate a deeper relationship with God.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Developing a Prayer Life",
                        Content =
                            """
                            A growing prayer life requires consistency.

                            Disciples can establish regular prayer times while also learning to pray throughout the day.

                            A healthy prayer life includes worship, confession, thanksgiving, intercession, listening, and personal requests.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 7
                // =====================================================
                [7] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Christlike Character",
                        Content =
                            """
                            Christian maturity includes becoming more like Jesus in character.

                            Character is revealed through choices, attitudes, relationships, and responses to circumstances.

                            Discipleship should produce visible transformation in everyday life.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "Humility and Servanthood",
                        Content =
                            """
                            Jesus demonstrated humility and servant leadership.

                            Christian disciples are called to place the needs of others ahead of selfish ambition.

                            Humility does not mean denying one's value. It means recognizing God's authority and serving others with love.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Integrity in Daily Life",
                        Content =
                            """
                            Integrity means living consistently with God's truth whether or not other people are watching.

                            Christian integrity affects finances, relationships, work, speech, commitments, and private decisions.

                            A disciple's public testimony should match private character.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Love and Forgiveness",
                        Content =
                            """
                            Christian love seeks the good of others and reflects God's love.

                            Forgiveness does not deny that wrong has occurred. It releases personal vengeance and chooses a Christlike response.

                            Mature disciples learn to love and forgive even when relationships are difficult.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Holiness and Obedience",
                        Content =
                            """
                            God calls His people to live holy lives.

                            Holiness means being set apart for God and increasingly reflecting His character.

                            Obedience is a practical expression of love for God and submission to His Word.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Handling Temptation",
                        Content =
                            """
                            Every disciple faces temptation.

                            Believers can respond by recognizing temptation, avoiding unnecessary opportunities for sin, relying on God's strength, praying, remembering Scripture, and seeking accountability.

                            Spiritual maturity includes learning how to respond to temptation faithfully.
                            """,
                        EstimatedMinutes = 25
                    }
                },

                // =====================================================
                // MODULE 8
                // =====================================================
                [8] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "Why the Church Matters",
                        Content =
                            """
                            Christianity is not intended to be lived in isolation.

                            The church is a community of believers who worship God, grow together, serve one another, and participate in God's mission.

                            Healthy discipleship includes meaningful participation in Christian community.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "Christian Fellowship",
                        Content =
                            """
                            Fellowship involves sharing life with other believers.

                            Christian fellowship provides encouragement, accountability, prayer, support, and opportunities for spiritual growth.

                            Disciples need relationships that encourage faithful living.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Worship and Community",
                        Content =
                            """
                            Worship is a response to who God is and what He has done.

                            Corporate worship brings believers together to honor God, hear His Word, pray, and encourage one another.

                            Worship should influence the believer's everyday life rather than being limited to a church service.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Serving in the Church",
                        Content =
                            """
                            Every believer can contribute to the life and mission of the church.

                            Service should be motivated by love rather than recognition.

                            Disciples discover ways to use their time, abilities, resources, and spiritual gifts to strengthen others.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Accountability and Spiritual Growth",
                        Content =
                            """
                            Accountability helps believers remain faithful and continue growing.

                            Trusted Christian relationships can provide encouragement, correction, prayer, and wisdom.

                            Healthy accountability is based on grace, truth, confidentiality, and a genuine desire for spiritual maturity.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Unity in the Body of Christ",
                        Content =
                            """
                            The church contains believers with different backgrounds, personalities, gifts, and responsibilities.

                            Unity does not require everyone to be identical.

                            Christian unity is grounded in Christ and expressed through love, humility, forgiveness, cooperation, and a shared mission.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 9
                // =====================================================
                [9] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "What Is the Gospel?",
                        Content =
                            """
                            The Gospel is the good news of God's saving work through Jesus Christ.

                            A disciple should understand the Gospel clearly enough to explain its central message to others.

                            The Gospel announces God's grace, human need, Christ's saving work, and the call to faith and repentance.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "Being a Witness for Christ",
                        Content =
                            """
                            Every Christian is called to represent Jesus faithfully.

                            Witnessing includes both our words and our actions.

                            A disciple can share what Christ has done, explain the Gospel, demonstrate Christlike love, and invite others to consider following Jesus.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Sharing Your Testimony",
                        Content =
                            """
                            A testimony describes how God has worked in a person's life.

                            An effective testimony points attention toward God's grace rather than personal achievement.

                            Believers can prepare a simple and honest account of their life before Christ, how they encountered the Gospel, and how Christ is transforming them.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Loving People Who Do Not Yet Believe",
                        Content =
                            """
                            Gospel ministry should be motivated by genuine love.

                            Disciples are called to treat people with dignity, patience, respect, compassion, and truth.

                            Evangelism is not about winning arguments. It is about faithfully communicating Christ and trusting God with the response.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Making Disciples",
                        Content =
                            """
                            Jesus commanded His followers to make disciples.

                            Making disciples includes helping people respond to the Gospel, teaching them Christ's commands, encouraging spiritual growth, and helping them become faithful followers of Jesus.

                            Discipleship is therefore both personal and reproductive.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Living on Mission",
                        Content =
                            """
                            Christians are called to participate in God's mission.

                            Mission includes sharing the Gospel, serving people, strengthening communities, demonstrating Christ's love, and helping others become disciples.

                            Every believer can participate in God's mission regardless of position or title.
                            """,
                        EstimatedMinutes = 20
                    }
                },

                // =====================================================
                // MODULE 10
                // =====================================================
                [10] = new[]
                {
                    new LessonSeed
                    {
                        SortOrder = 1,
                        Title = "A Lifestyle of Discipleship",
                        Content =
                            """
                            Discipleship is not limited to a course or church program.

                            It is a lifelong way of following Jesus.

                            Mature disciples continue learning, obeying, serving, worshiping, and helping others grow.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 2,
                        Title = "Managing Your Time for God",
                        Content =
                            """
                            Time is a gift from God.

                            Christian disciples learn to prioritize God, family, responsibilities, relationships, service, rest, and personal growth.

                            Wise stewardship of time allows believers to live intentionally rather than simply reacting to circumstances.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 3,
                        Title = "Stewardship and Generosity",
                        Content =
                            """
                            Stewardship means recognizing that everything ultimately belongs to God.

                            Believers are called to manage resources faithfully, including finances, possessions, abilities, opportunities, and time.

                            Generosity reflects trust in God and love toward others.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 4,
                        Title = "Serving with Your Gifts",
                        Content =
                            """
                            God equips His people to serve.

                            Disciples should identify their strengths and spiritual gifts and look for opportunities to use them for God's purposes.

                            Faithful service is not measured primarily by visibility but by obedience and love.
                            """,
                        EstimatedMinutes = 20
                    },

                    new LessonSeed
                    {
                        SortOrder = 5,
                        Title = "Multiplying Disciples",
                        Content =
                            """
                            Mature disciples help other people become disciples.

                            Multiplication happens when believers intentionally invest in others through teaching, encouragement, mentoring, prayer, example, and service.

                            The goal is not simply to complete a course but to reproduce faithful followers of Christ.
                            """,
                        EstimatedMinutes = 25
                    },

                    new LessonSeed
                    {
                        SortOrder = 6,
                        Title = "Your Lifelong Discipleship Plan",
                        Content =
                            """
                            Christian growth is a lifelong journey.

                            A personal discipleship plan can include regular Bible reading, prayer, worship, church involvement, service, accountability, evangelism, and intentional spiritual goals.

                            The completion of this course is not the end of discipleship. It is a foundation for a lifetime of following Jesus and helping others follow Him.
                            """,
                        EstimatedMinutes = 25
                    }
                }
            };

            // =========================================================
            // CREATE LESSONS
            // =========================================================

            foreach (var moduleSeed in modules)
            {
                var module =
                    moduleEntities[moduleSeed.SortOrder];

                var lessons =
                    lessonGroups[moduleSeed.SortOrder];

                foreach (var lessonSeed in lessons)
                {
                    var existingLesson =
                        await context.Lessons
                            .FirstOrDefaultAsync(l =>
                                l.CourseModuleId ==
                                    module.CourseModuleId &&
                                l.SortOrder ==
                                    lessonSeed.SortOrder);

                    if (existingLesson != null)
                    {
                        // Preserve existing lesson.
                        Console.WriteLine(
                            $"Existing Lesson: Module {module.SortOrder}, " +
                            $"Lesson {lessonSeed.SortOrder}: " +
                            $"{existingLesson.Title}");

                        continue;
                    }

                    var lesson = new Lesson
                    {
                        CourseModuleId =
                            module.CourseModuleId,

                        Title =
                            lessonSeed.Title,

                        Content =
                            lessonSeed.Content,

                        VideoUrl = null,

                        ResourceUrl = null,

                        SortOrder =
                            lessonSeed.SortOrder,

                        EstimatedMinutes =
                            lessonSeed.EstimatedMinutes,

                        IsPublished = true,

                        IsFreePreview =
                            module.SortOrder == 1 &&
                            lessonSeed.SortOrder == 1,

                        CreatedDate =
                            DateTime.UtcNow,

                        UpdatedDate = null
                    };

                    context.Lessons.Add(lesson);

                    Console.WriteLine(
                        $"Created Lesson: Module {module.SortOrder}, " +
                        $"Lesson {lessonSeed.SortOrder}: " +
                        $"{lesson.Title}");
                }
            }

            await context.SaveChangesAsync();

            // =========================================================
            // VERIFY
            // =========================================================

            var moduleCount =
                await context.CourseModules
                    .CountAsync(m =>
                        m.CourseId == course.CourseId);

            var lessonCount =
                await context.Lessons
                    .Where(l =>
                        l.CourseModule != null &&
                        l.CourseModule.CourseId ==
                            course.CourseId)
                    .CountAsync();

            Console.WriteLine(
                "============================================");

            Console.WriteLine(
                $"Course 1 Module Count: {moduleCount}");

            Console.WriteLine(
                $"Course 1 Lesson Count: {lessonCount}");

            Console.WriteLine(
                "============================================");

            if (moduleCount == 10 && lessonCount == 60)
            {
                Console.WriteLine(
                    "SUCCESS: Course 1 now has 10 modules and 60 lessons.");
            }
            else
            {
                Console.WriteLine(
                    "WARNING: Course 1 does not yet contain 10 modules and 60 lessons.");
            }
        }

        // =============================================================
        // SEED DTOs
        // =============================================================

        private sealed class ModuleSeed
        {
            public int SortOrder { get; set; }

            public string Title { get; set; } = string.Empty;

            public string Description { get; set; } = string.Empty;
        }

        private sealed class LessonSeed
        {
            public int SortOrder { get; set; }

            public string Title { get; set; } = string.Empty;

            public string Content { get; set; } = string.Empty;

            public int EstimatedMinutes { get; set; }
        }
    }
}