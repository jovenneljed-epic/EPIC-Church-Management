// ============================================================
// epicGenerationsCurriculum.ts
// EPIC CHURCH MANAGEMENT SYSTEM - Luke 4:18 Ministries
// Systematic 5-Stage Discipleship Curriculum & Learning Progress Bridge
//
// Unifying Church in Action (Generational Monitoring) & EPIC Learning (LMS)
// Aligned with 2 Timothy 2:2 & Matthew 28:19-20
// ============================================================

export interface StageLockInfo {
    stage: 1 | 2 | 3 | 4 | 5;
    courseId: number;
    courseTitle: string;
    isLocked: boolean;
    requiredStage: (1 | 2 | 3 | 4 | 5) | null;
    requiredStageTitle: string | null;
    requiredStageCourseId: number | null;
    requiredStageCompletedCount: number;
    requiredStageTotalLessons: number;
    requiredStageProgressPct: number;
    isPrerequisiteSatisfied: boolean;
    lockReason: string | null;
}

export interface CurriculumLesson {
    lessonNumber: number;
    title: string;
    scriptureAnchor: string;
    objectives: string[];
    memoryVerse: string;
    practicalAction: string;
    quizQuestion: {
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
    };
}

export interface CurriculumModule {
    moduleNumber: number;
    title: string;
    description: string;
    lessons: CurriculumLesson[];
}

export interface DiscipleshipCourseProgram {
    stage: 1 | 2 | 3 | 4 | 5;
    generationLevel: "Gen 1" | "Gen 2" | "Gen 3" | "Gen 4" | "Gen 5";
    generationTitle: string;
    courseCode: string;
    courseTitle: string;
    subtitle: string;
    category: string;
    targetAudience: string;
    totalWeeks: number;
    totalLessons: number;
    modulesCount: number;
    icon: string;
    themeColor: string;
    bannerGradient: string;
    badgeClass: string;
    description: string;
    modules: CurriculumModule[];
}

// ============================================================
// THE 5-STAGE OFFICIAL CURRICULUM BLUEPRINT
// ============================================================

export const EPIC_GENERATIONS_CURRICULUM: DiscipleshipCourseProgram[] = [
    // --------------------------------------------------------
    // STAGE 1: FOUNDATION (GEN 1: NEW BELIEVER)
    // --------------------------------------------------------
    {
        stage: 1,
        generationLevel: "Gen 1",
        generationTitle: "New Believer",
        courseCode: "GEN-101",
        courseTitle: "Foundations of Christian Discipleship",
        subtitle: "Rooted & Grounded in Christ: First Steps in the Kingdom of God",
        category: "Stage 1 — Foundation",
        targetAudience: "New converts, newly baptized believers, and newcomers establishing roots",
        totalWeeks: 6,
        totalLessons: 18,
        modulesCount: 6,
        icon: "✨",
        themeColor: "#0284c7",
        bannerGradient: "linear-gradient(135deg, #0369a1, #0284c7)",
        badgeClass: "stage-1",
        description: "Comprehensive foundational doctrine covering salvation by grace, water baptism, daily prayer, Bible reading, and local church commitment.",
        modules: [
            {
                moduleNumber: 1,
                title: "Assurance of Salvation & The Gospel",
                description: "Grasping the unshakeable foundation of grace and the gift of eternal life.",
                lessons: [
                    {
                        lessonNumber: 1,
                        title: "Salvation by Grace Through Faith",
                        scriptureAnchor: "Ephesians 2:8-9; Romans 10:9-10",
                        objectives: ["Understand that salvation cannot be earned by good deeds", "Confess Jesus Christ as Lord and personal Savior", "Rest in the completed work of the Cross"],
                        memoryVerse: "“For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast.” — Ephesians 2:8-9",
                        practicalAction: "Write down your salvation testimony in 3 sentences and thank God in prayer for His unmerited grace.",
                        quizQuestion: {
                            question: "According to Ephesians 2:8-9, what is the basis of our salvation?",
                            options: ["Our religious deeds and good works", "Grace through faith, as a gift from God", "Water baptism and fasting", "Church attendance"],
                            correctAnswer: 1,
                            explanation: "Salvation is solely the gift of God received through faith in Christ, not by human effort."
                        }
                    },
                    {
                        lessonNumber: 2,
                        title: "The Assurance of Eternal Life",
                        scriptureAnchor: "1 John 5:11-13; John 10:28-29",
                        objectives: ["Distinguish between feelings and biblical promises", "Understand eternal security in the hand of the Father", "Overcome doubt about your standing before God"],
                        memoryVerse: "“These things I have written to you who believe in the name of the Son of God, that you may know that you have eternal life.” — 1 John 5:13",
                        practicalAction: "Memorize 1 John 5:13 and repeat it whenever feelings of spiritual unworthiness arise.",
                        quizQuestion: {
                            question: "How can a believer know they have eternal life?",
                            options: ["By how emotional they feel each Sunday", "Through the unchanging testimony of God's Word in Christ", "Only after dying and reaching heaven", "By never making a single mistake"],
                            correctAnswer: 1,
                            explanation: "God gave us His written Word so that everyone who believes on the Son of God may have full assurance of eternal life."
                        }
                    },
                    {
                        lessonNumber: 3,
                        title: "New Creation Identity in Christ",
                        scriptureAnchor: "2 Corinthians 5:17; Galatians 2:20",
                        objectives: ["Recognize that the old life is buried with Christ", "Embrace your new identity as a son or daughter of God", "Learn to walk in newness of spirit"],
                        memoryVerse: "“Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.” — 2 Corinthians 5:17",
                        practicalAction: "List 3 old destructive habits and prayerfully declare your new identity in Christ over each one.",
                        quizQuestion: {
                            question: "What happened to a believer's spiritual status upon receiving Christ?",
                            options: ["They became a slightly improved version of their old self", "They became a brand-new creation in Christ", "They have to restart their physical life", "Nothing changed spiritually"],
                            correctAnswer: 1,
                            explanation: "2 Corinthians 5:17 declares that in Christ, the old life has passed away and we are entirely new spiritual creations."
                        }
                    }
                ]
            },
            {
                moduleNumber: 2,
                title: "Water Baptism & Public Confession",
                description: "Walking in joyful obedience to Christ through the biblical ordinance of baptism.",
                lessons: [
                    {
                        lessonNumber: 4,
                        title: "The Meaning & Mandate of Water Baptism",
                        scriptureAnchor: "Matthew 28:19; Romans 6:3-4",
                        objectives: ["Understand water baptism as an outward sign of an inward reality", "Identify with Christ's death, burial, and resurrection", "Prepare for public obedience"],
                        memoryVerse: "“Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.” — Matthew 28:19",
                        practicalAction: "If not yet baptized, schedule your water baptism interview with your spiritual mentor or pastor.",
                        quizQuestion: {
                            question: "What does immersion in water baptism symbolize?",
                            options: ["Washing away physical dust", "Being buried with Christ and rising to walk in newness of life", "Graduating from church school", "Earning salvation"],
                            correctAnswer: 1,
                            explanation: "Romans 6:4 explains that we were buried with Him through baptism into death, just as Christ was raised from the dead."
                        }
                    },
                    {
                        lessonNumber: 5,
                        title: "The Lord's Supper & Communion",
                        scriptureAnchor: "1 Corinthians 11:23-29; Luke 22:19-20",
                        objectives: ["Celebrate the covenant established in Christ's body and blood", "Examine personal motives and honor the Lord's table", "Experience spiritual renewal in fellowship"],
                        memoryVerse: "“For as often as you eat this bread and drink this cup, you proclaim the Lord's death till He comes.” — 1 Corinthians 11:26",
                        practicalAction: "Participate reverently in the next church communion service with self-examination and thanksgiving.",
                        quizQuestion: {
                            question: "Why do believers regularly partake of the Lord's Supper?",
                            options: ["To satisfy physical hunger", "In remembrance of Christ's sacrifice, proclaiming His death until He returns", "To earn forgiveness for past sins", "As a mandatory legal ritual"],
                            correctAnswer: 1,
                            explanation: "Jesus commanded, 'Do this in remembrance of Me', declaring His sacrificial death and impending return."
                        }
                    },
                    {
                        lessonNumber: 6,
                        title: "Repentance & Breaking with Past Sin",
                        scriptureAnchor: "Acts 3:19; 1 John 1:9",
                        objectives: ["Distinguish between godly sorrow and worldly remorse", "Confess specific sins and renounce ungodly ties", "Walk in the light of God's forgiveness"],
                        memoryVerse: "“If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.” — 1 John 1:9",
                        practicalAction: "Spend 15 minutes in quiet reflection, confessing any known sin to God and receiving His cleansing.",
                        quizQuestion: {
                            question: "What does 1 John 1:9 promise when we confess our sins to God?",
                            options: ["He might forgive us if we perform penance", "He is faithful and just to forgive and cleanse us from all unrighteousness", "He will expose us publicly", "He rejects us permanently"],
                            correctAnswer: 1,
                            explanation: "God's promise is total forgiveness and complete spiritual cleansing based on Christ's blood."
                        }
                    }
                ]
            },
            {
                moduleNumber: 3,
                title: "The Word of God & Daily Devotions",
                description: "Establishing a daily habit of feeding on Scripture for spiritual nutrition.",
                lessons: [
                    {
                        lessonNumber: 7,
                        title: "The Divine Authority & Inspiration of Scripture",
                        scriptureAnchor: "2 Timothy 3:16-17; Psalm 119:105",
                        objectives: ["Trust the Bible as God's inspired, error-free truth", "Acknowledge Scripture as the final rule for faith and practice", "Develop reverence for the Word"],
                        memoryVerse: "“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105",
                        practicalAction: "Set aside 15 minutes each morning to read 1 chapter of the New Testament (starting in the Gospel of John).",
                        quizQuestion: {
                            question: "According to 2 Timothy 3:16, how much of Scripture is inspired by God?",
                            options: ["Only the New Testament", "All Scripture is given by inspiration of God", "Only the parts we agree with", "None of it"],
                            correctAnswer: 1,
                            explanation: "All Scripture is God-breathed and profitable for doctrine, reproof, correction, and instruction in righteousness."
                        }
                    },
                    {
                        lessonNumber: 8,
                        title: "How to Read, Study & Meditate on the Bible",
                        scriptureAnchor: "Joshua 1:8; Psalm 1:1-3",
                        objectives: ["Learn the SOAP devotional method (Scripture, Observation, Application, Prayer)", "Cultivate daily meditation on Scripture", "Apply biblical truths to daily situations"],
                        memoryVerse: "“This Book of the Law shall not depart from your mouth, but you shall meditate in it day and night...” — Joshua 1:8",
                        practicalAction: "Use a devotional notebook today to write 1 observation and 1 personal application from your Bible reading.",
                        quizQuestion: {
                            question: "What is the biblical promise for meditating on God's Word day and night in Joshua 1:8?",
                            options: ["You will make your way prosperous and have good success", "You will never face difficulties", "You will know everything instantly", "You won't need church fellowship"],
                            correctAnswer: 0,
                            explanation: "Joshua 1:8 promises that meditating on and obeying the Word brings spiritual prosperity and good success."
                        }
                    },
                    {
                        lessonNumber: 9,
                        title: "Scripture Memorization & Meditation",
                        scriptureAnchor: "Psalm 119:11; Colossians 3:16",
                        objectives: ["Hide God's Word in your heart against temptation", "Allow the Word of Christ to dwell richly within", "Use Scripture during prayer and spiritual warfare"],
                        memoryVerse: "“Your word I have hidden in my heart, that I might not sin against You.” — Psalm 119:11",
                        practicalAction: "Write Psalm 119:11 on an index card or phone lock screen and memorize it today.",
                        quizQuestion: {
                            question: "Why did the psalmist hide God's Word in his heart in Psalm 119:11?",
                            options: ["To show off Bible knowledge", "That he might not sin against God", "To pass a theological exam", "To win theological arguments"],
                            correctAnswer: 1,
                            explanation: "Hiding Scripture in the heart provides divine resistance against temptation and sinful impulses."
                        }
                    }
                ]
            },
            {
                moduleNumber: 4,
                title: "Prayer & Secret Place Communion",
                description: "Developing an intimate, conversational prayer life with the Father.",
                lessons: [
                    {
                        lessonNumber: 10,
                        title: "The Privilege & Pattern of Prayer",
                        scriptureAnchor: "Matthew 6:5-13; Luke 11:1-4",
                        objectives: ["Pray with confidence directly to the Father in Jesus' name", "Use the Lord's Prayer as a biblical model", "Avoid vain repetition and hypocritical pretense"],
                        memoryVerse: "“In this manner, therefore, pray: Our Father in heaven, hallowed be Your name. Your kingdom come. Your will be done on earth as it is in heaven.” — Matthew 6:9-10",
                        practicalAction: "Pray through the Lord's Prayer today, turning each phrase into personal thanksgiving and petition.",
                        quizQuestion: {
                            question: "In whose name did Jesus teach believers to ask the Father?",
                            options: ["In our own name and merit", "In the name of Jesus Christ", "In the name of an earthly leader", "Without any name"],
                            correctAnswer: 1,
                            explanation: "Jesus declared: 'Whatever you ask the Father in My name He will give you' (John 16:23)."
                        }
                    },
                    {
                        lessonNumber: 11,
                        title: "Overcoming Hindrances to Prayer",
                        scriptureAnchor: "James 4:2-3; Mark 11:24-25; 1 Peter 3:7",
                        objectives: ["Identify common blocks to prayer: unconfessed sin, unforgiveness, selfish motives", "Release forgiveness toward anyone who wronged you", "Pray with sincere faith"],
                        memoryVerse: "“And whenever you stand praying, if you have anything against anyone, forgive him, that your Father in heaven may also forgive you your trespasses.” — Mark 11:25",
                        practicalAction: "Release any lingering offense or resentment in prayer, forgiving unconditionally.",
                        quizQuestion: {
                            question: "What major requirement did Jesus place on prayer in Mark 11:25?",
                            options: ["Fasting for 40 days", "Forgiving anyone you have something against", "Using archaic religious words", "Praying in public"],
                            correctAnswer: 1,
                            explanation: "Jesus emphasized that unforgiveness hinders prayer and our fellowship with the Father."
                        }
                    },
                    {
                        lessonNumber: 12,
                        title: "Fasting & Seeking God's Face",
                        scriptureAnchor: "Matthew 6:16-18; Isaiah 58:6-9",
                        objectives: ["Understand biblical fasting as humbling oneself before God", "Align fasting with pure motives, not showmanship", "Experience spiritual sensitivity through fasting"],
                        memoryVerse: "“Moreover, when you fast, do not be like the hypocrites, with a sad countenance... but anoint your head and wash your face.” — Matthew 6:16-17",
                        practicalAction: "Plan a half-day or 1-meal fast this week dedicated to seeking God for personal spiritual breakthrough.",
                        quizQuestion: {
                            question: "What is the primary spiritual purpose of biblical fasting?",
                            options: ["Dieting for physical fitness", "Humbling oneself before God to seek His will and align with His heart", "Forcing God to give us what we want", "Showing others our spirituality"],
                            correctAnswer: 1,
                            explanation: "Fasting is a sacred discipline of denying the flesh to heighten spiritual focus and communion with God."
                        }
                    }
                ]
            },
            {
                moduleNumber: 5,
                title: "The Holy Spirit & Life in the Spirit",
                description: "Experiencing the presence, empowerment, and guidance of the Holy Spirit.",
                lessons: [
                    {
                        lessonNumber: 13,
                        title: "Who is the Holy Spirit?",
                        scriptureAnchor: "John 14:16-17, 26; John 16:7-14",
                        objectives: ["Recognize the Holy Spirit as the third Person of the Trinity", "Welcome Him as our Helper, Comforter, Counselor, and Teacher", "Build an intimate friendship with Him"],
                        memoryVerse: "“And I will pray the Father, and He will give you another Helper, that He may abide with you forever—the Spirit of truth.” — John 14:16-17",
                        practicalAction: "Begin each day by whispering: 'Holy Spirit, guide my thoughts, words, and actions today.'",
                        quizQuestion: {
                            question: "How did Jesus describe the role of the Holy Spirit in John 14:16?",
                            options: ["An impersonal cosmic energy", "Another Helper (Paraclete) who will abide with us forever", "A temporary historical presence", "A stern judge looking for faults"],
                            correctAnswer: 1,
                            explanation: "Jesus introduced the Holy Spirit as 'another Helper' of the exact same divine nature to guide and comfort believers."
                        }
                    },
                    {
                        lessonNumber: 14,
                        title: "The Baptism & Filling of the Holy Spirit",
                        scriptureAnchor: "Acts 1:8; Acts 2:1-4; Ephesians 5:18",
                        objectives: ["Distinguish between indwelling at salvation and baptism in the Spirit for power", "Seek God's continuous filling of the Holy Spirit", "Receive supernatural boldness to witness"],
                        memoryVerse: "“But you shall receive power when the Holy Spirit has come upon you; and you shall be witnesses to Me...” — Acts 1:8",
                        practicalAction: "Pray with your spiritual parent or pastor for a fresh filling of the Holy Spirit and boldness to witness.",
                        quizQuestion: {
                            question: "What is the primary promised outcome of receiving the Holy Spirit in Acts 1:8?",
                            options: ["Instant worldly wealth", "Supernatural power to be witnesses for Jesus Christ", "Personal fame and applause", "Exemption from all hardship"],
                            correctAnswer: 1,
                            explanation: "Acts 1:8 promises divine dunamis power to be fruitful witnesses for Christ locally and globally."
                        }
                    },
                    {
                        lessonNumber: 15,
                        title: "Walking in the Spirit vs. The Desires of the Flesh",
                        scriptureAnchor: "Galatians 5:16-25; Romans 8:1-14",
                        objectives: ["Yield daily to the prompting of the Spirit", "Mortify sinful impulses through the Spirit's power", "Cultivate the fruit of love, joy, and peace"],
                        memoryVerse: "“I say then: Walk in the Spirit, and you shall not fulfill the lust of the flesh.” — Galatians 5:16",
                        practicalAction: "When faced with anger or temptation today, pause, take a deep breath, and surrender the moment to the Spirit.",
                        quizQuestion: {
                            question: "According to Galatians 5:16, how do believers avoid fulfilling the lusts of the flesh?",
                            options: ["By sheer human willpower alone", "By walking in the Spirit", "By isolating from all other people", "By pretending temptations do not exist"],
                            correctAnswer: 1,
                            explanation: "Walking in the Spirit empowers the believer above the pull of the carnal nature."
                        }
                    }
                ]
            },
            {
                moduleNumber: 6,
                title: "Fellowship, Church Family & Personal Witness",
                description: "Committing to the local church body and sharing Christ with others.",
                lessons: [
                    {
                        lessonNumber: 16,
                        title: "The Local Church: God's Chosen Family",
                        scriptureAnchor: "Acts 2:42-47; Hebrews 10:24-25",
                        objectives: ["Understand the church as the living body of Christ", "Commit to regular attendance and active participation", "Value the protection of spiritual authority and community"],
                        memoryVerse: "“And let us consider one another in order to stir up love and good works, not forsaking the assembling of ourselves together...” — Hebrews 10:24-25",
                        practicalAction: "Introduce yourself to 2 new brothers or sisters at church this Sunday.",
                        quizQuestion: {
                            question: "Why does Hebrews 10:25 urge believers not to forsake assembling together?",
                            options: ["To satisfy social quotas", "To encourage one another and stir up love and good works", "Because God only hears prayers inside church walls", "To collect membership badges"],
                            correctAnswer: 1,
                            explanation: "Gathering as the body of Christ provides mutual encouragement, spiritual accountability, and kingdom power."
                        }
                    },
                    {
                        lessonNumber: 17,
                        title: "Sharing Your Personal Testimony",
                        scriptureAnchor: "Mark 5:19; 1 Peter 3:15; Revelation 12:11",
                        objectives: ["Outline your testimony: Life Before Christ, How You Met Christ, Life After Christ", "Overcome fear of rejection", "Speak with gentleness, respect, and authenticity"],
                        memoryVerse: "“Always be ready to give a defense to everyone who asks you a reason for the hope that is in you, with meekness and fear.” — 1 Peter 3:15",
                        practicalAction: "Share your 2-minute testimony with your spiritual mentor this week for encouragement and practice.",
                        quizQuestion: {
                            question: "What 3 parts make up a clear, Christ-centered personal testimony?",
                            options: ["Complaining about church, asking for money, and giving an opinion", "My life before Christ, how I encountered Jesus, and how my life changed since", "Criticizing other religions, quoting Latin, and leaving", "Only talking about personal achievements"],
                            correctAnswer: 1,
                            explanation: "A biblical testimony simply recounts life before Christ, the encounter with the Savior, and the transformation that followed."
                        }
                    },
                    {
                        lessonNumber: 18,
                        title: "Next Steps: Advancing to Stage 2 Formation",
                        scriptureAnchor: "Colossians 2:6-7; Philippians 1:6",
                        objectives: ["Review the 18 foundation milestones achieved", "Affirm baptism, church connection, and daily devotions", "Graduate and prepare for Stage 2 Formation"],
                        memoryVerse: "“As you therefore have received Christ Jesus the Lord, so walk in Him, rooted and built up in Him and established in the faith.” — Colossians 2:6-7",
                        practicalAction: "Complete your Stage 1 Foundation assessment and schedule a review with your spiritual parent.",
                        quizQuestion: {
                            question: "What is God's promise regarding the spiritual work He began in your life (Philippians 1:6)?",
                            options: ["He might abandon it if you fail", "He who began a good work in you will complete it until the day of Jesus Christ", "It is entirely dependent on your own perfection", "He starts over every year"],
                            correctAnswer: 1,
                            explanation: "Philippians 1:6 guarantees that the faithful God who initiated your salvation will faithfully complete it."
                        }
                    }
                ]
            }
        ]
    },

    // --------------------------------------------------------
    // STAGE 2: FORMATION (GEN 2: GROWING DISCIPLE)
    // --------------------------------------------------------
    {
        stage: 2,
        generationLevel: "Gen 2",
        generationTitle: "Growing Disciple",
        courseCode: "GEN-201",
        courseTitle: "Spiritual Formation & Christian Habits",
        subtitle: "Deepening Character, Biblical Worldview & Kingdom Disciplines",
        category: "Stage 2 — Formation",
        targetAudience: "Growing believers established in foundation, active in a Life Group, deepening their spiritual walk",
        totalWeeks: 6,
        totalLessons: 18,
        modulesCount: 6,
        icon: "🌿",
        themeColor: "#16a34a",
        bannerGradient: "linear-gradient(135deg, #15803d, #16a34a)",
        badgeClass: "stage-2",
        description: "Transformative formation in Christian habits, biblical worldview, victory over temptation, tithing and financial stewardship, and emotional wholeness.",
        modules: [
            {
                moduleNumber: 1,
                title: "Biblical Worldview & Renewing the Mind",
                description: "Aligning thoughts, values, and worldview with the eternal Word of God.",
                lessons: [
                    {
                        lessonNumber: 1,
                        title: "The Battle for the Mind",
                        scriptureAnchor: "Romans 12:1-2; 2 Corinthians 10:3-5",
                        objectives: ["Refuse conformity to worldly patterns", "Take every thought captive to the obedience of Christ", "Practice continuous mental renewal through Scripture"],
                        memoryVerse: "“And do not be conformed to this world, but be transformed by the renewing of your mind...” — Romans 12:2",
                        practicalAction: "Identify 1 worldly ideology or media source influencing your thoughts and replace it with Scripture meditation.",
                        quizQuestion: {
                            question: "How does Romans 12:2 instruct believers to experience spiritual transformation?",
                            options: ["By conforming to popular cultural trends", "By the renewing of your mind through God's truth", "By withdrawing from society completely", "By achieving financial success"],
                            correctAnswer: 1,
                            explanation: "True transformation occurs from the inside out through the systematic renewal of our thinking by the Holy Spirit and the Word."
                        }
                    },
                    {
                        lessonNumber: 2,
                        title: "Truth vs. Cultural Deception",
                        scriptureAnchor: "Colossians 2:8; John 8:31-32",
                        objectives: ["Discern deceptive philosophies and cultural trends", "Stand firm on absolute moral and biblical truth", "Walk in the freedom that only divine truth provides"],
                        memoryVerse: "“And you shall know the truth, and the truth shall make you free.” — John 8:32",
                        practicalAction: "Compare a current cultural trend with Scripture and write a 1-paragraph biblical perspective on it.",
                        quizQuestion: {
                            question: "What is the condition Jesus gave in John 8:31-32 for knowing the truth that sets free?",
                            options: ["If you have high academic degrees", "If you abide in My word, you are My disciples indeed", "If you follow public opinion", "If you never face trials"],
                            correctAnswer: 1,
                            explanation: "Abiding faithfully in the Word of Christ is the biblical prerequisite for knowing liberating truth."
                        }
                    },
                    {
                        lessonNumber: 3,
                        title: "Cultivating Holy Desires & Kingdom Priorities",
                        scriptureAnchor: "Matthew 6:33; Colossians 3:1-4",
                        objectives: ["Seek first the Kingdom of God in daily decision making", "Set your affection on things above, not on earthly fads", "Align time, energy, and goals with God's will"],
                        memoryVerse: "“But seek first the kingdom of God and His righteousness, and all these things shall be added to you.” — Matthew 6:33",
                        practicalAction: "Review your calendar and budget for this week to ensure Kingdom priorities are in first place.",
                        quizQuestion: {
                            question: "What divine promise accompanies seeking first the Kingdom of God (Matthew 6:33)?",
                            options: ["You will never have to work", "All necessary earthly things will be added unto you", "You will be free from all responsibilities", "You will instantly be rich"],
                            correctAnswer: 1,
                            explanation: "God promises that when His Kingdom and righteousness are our first priority, He faithfully provides for all our daily needs."
                        }
                    }
                ]
            },
            {
                moduleNumber: 2,
                title: "Victory Over Temptation & Spiritual Warfare",
                description: "Standing victorious against the world, the flesh, and the adversary.",
                lessons: [
                    {
                        lessonNumber: 4,
                        title: "Understanding the Nature of Temptation",
                        scriptureAnchor: "1 Corinthians 10:13; James 1:13-15",
                        objectives: ["Recognize that temptation is common to all men", "Trust God's promise of an escape route in every temptation", "Stop blaming God for personal lusts and desires"],
                        memoryVerse: "“No temptation has overtaken you except such as is common to man; but God is faithful, who will not allow you to be tempted beyond what you are able...” — 1 Corinthians 10:13",
                        practicalAction: "Identify your most vulnerable hour or setting for temptation, and proactively create a boundary of protection.",
                        quizQuestion: {
                            question: "What does 1 Corinthians 10:13 guarantee when a believer is tempted?",
                            options: ["That temptation will destroy them", "That God is faithful and will provide the way of escape", "That temptation is a sin in itself", "That believers are immune from temptation"],
                            correctAnswer: 1,
                            explanation: "God's faithfulness ensures that with every temptation, He provides a way to bear it and escape victoriously."
                        }
                    },
                    {
                        lessonNumber: 5,
                        title: "Putting on the Whole Armor of God",
                        scriptureAnchor: "Ephesians 6:10-18; 1 Peter 5:8-9",
                        objectives: ["Suit up daily in spiritual armor: Truth, Righteousness, Gospel Peace, Faith, Salvation, and the Word", "Stand firm against demonic schemes", "Pray always with all prayer in the Spirit"],
                        memoryVerse: "“Put on the whole armor of God, that you may be able to stand against the wiles of the devil.” — Ephesians 6:11",
                        practicalAction: "Pray through each piece of the armor of God before stepping out of your house in the morning.",
                        quizQuestion: {
                            question: "What is the only offensive weapon mentioned in the Armor of God (Ephesians 6:17)?",
                            options: ["The Belt of Truth", "The Shield of Faith", "The Sword of the Spirit, which is the word of God", "The Breastplate of Righteousness"],
                            correctAnswer: 2,
                            explanation: "The Sword of the Spirit—the spoken Word of God (Rhema)—is the offensive weapon given to disarm the enemy."
                        }
                    },
                    {
                        lessonNumber: 6,
                        title: "Walking in Purity & Moral Victory",
                        scriptureAnchor: "1 Thessalonians 4:3-5; 1 Corinthians 6:18-20",
                        objectives: ["Honor your body as a sacred temple of the Holy Spirit", "Flee sexual immorality, internet pornography, and lust", "Maintain purity in thought, speech, and dating relationships"],
                        memoryVerse: "“Flee sexual immorality... Or do you not know that your body is the temple of the Holy Spirit who is in you, whom you have from God, and you are not your own?” — 1 Corinthians 6:18-19",
                        practicalAction: "Install an accountability filter or partner on your digital devices and commit to transparency.",
                        quizQuestion: {
                            question: "Why does Paul urge believers to honor God with their bodies (1 Corinthians 6:19-20)?",
                            options: ["Because our bodies belong to society", "Because your body is the temple of the Holy Spirit, bought with a price", "Because the body is evil and unimportant", "Because of church rules"],
                            correctAnswer: 1,
                            explanation: "Our bodies are bought by the precious blood of Jesus and dwell as the living temple of the Holy Spirit."
                        }
                    }
                ]
            },
            {
                moduleNumber: 3,
                title: "Christlike Character & The Fruit of the Spirit",
                description: "Cultivating supernatural fruit that reflects the heart of Jesus.",
                lessons: [
                    {
                        lessonNumber: 7,
                        title: "The Ninefold Fruit of the Spirit",
                        scriptureAnchor: "Galatians 5:22-23; John 15:1-8",
                        objectives: ["Contrast religious legalism with supernatural Spirit-born fruit", "Abide in Christ the true Vine to bear lasting fruit", "Allow God to prune dead branches in your life"],
                        memoryVerse: "“But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control.” — Galatians 5:22-23",
                        practicalAction: "Pick 1 fruit of the Spirit you find most challenging (e.g. patience or gentleness) and intentionally practice it today.",
                        quizQuestion: {
                            question: "How does a believer bear much fruit according to John 15:5?",
                            options: ["By striving in human flesh", "By abiding in Jesus Christ, for without Him we can do nothing", "By memorizing dictionary definitions", "By competing with other believers"],
                            correctAnswer: 1,
                            explanation: "Abiding in living union with Christ produces the fruit; disconnected from Him we are spiritually powerless."
                        }
                    },
                    {
                        lessonNumber: 8,
                        title: "Humility, Meekness & The Servant's Heart",
                        scriptureAnchor: "Philippians 2:3-8; 1 Peter 5:5-6",
                        objectives: ["Embrace the mindset of Christ who emptied Himself", "Let nothing be done through selfish ambition or conceit", "Humble yourself under the mighty hand of God"],
                        memoryVerse: "“Let this mind be in you which was also in Christ Jesus, who... made Himself of no reputation, taking the form of a bondservant...” — Philippians 2:5-7",
                        practicalAction: "Perform a quiet act of service for someone at home or in church without seeking any recognition or credit.",
                        quizQuestion: {
                            question: "What does 1 Peter 5:5 say God does toward the humble?",
                            options: ["God ignores them", "God resists the proud, but gives grace to the humble", "God punishes them", "God makes them servants of men"],
                            correctAnswer: 1,
                            explanation: "Scripture repeatedly declares that God actively resists prideful hearts but pours out favor on the humble."
                        }
                    },
                    {
                        lessonNumber: 9,
                        title: "Taming the Tongue & Edifying Speech",
                        scriptureAnchor: "James 3:1-12; Ephesians 4:29",
                        objectives: ["Recognize the destructive power of unbridled words", "Eliminate gossip, backbiting, lying, and cursing", "Speak words that impart grace to those who hear"],
                        memoryVerse: "“Let no corrupt word proceed out of your mouth, but what is good for necessary edification, that it may impart grace to the hearers.” — Ephesians 4:29",
                        practicalAction: "Go the entire day without speaking a single complaint, gossip, or negative criticism; speak words of blessing instead.",
                        quizQuestion: {
                            question: "According to Ephesians 4:29, what should be the purpose of all our spoken words?",
                            options: ["To show how clever and humorous we are", "For necessary edification, imparting grace to those who hear", "To vent our emotional frustration", "To dominate debates"],
                            correctAnswer: 1,
                            explanation: "Believers are called to speak only what builds up others and imparts divine grace to listeners."
                        }
                    }
                ]
            },
            {
                moduleNumber: 4,
                title: "Kingdom Stewardship & Financial Wholeness",
                description: "Managing God's financial resources with transparency and faith.",
                lessons: [
                    {
                        lessonNumber: 10,
                        title: "God as the Owner of Everything",
                        scriptureAnchor: "Psalm 24:1; 1 Chronicles 29:11-14",
                        objectives: ["Acknowledge that God owns all heaven, earth, and personal assets", "See yourself as a trusted manager, not an autonomous owner", "Live with an open-handed posture toward God's promptings"],
                        memoryVerse: "“The earth is the Lord's, and all its fullness, the world and those who dwell therein.” — Psalm 24:1",
                        practicalAction: "Dedicate everything you own—finances, possessions, career—to God in a written prayer of surrender.",
                        quizQuestion: {
                            question: "Who owns the earth and all its resources according to Psalm 24:1?",
                            options: ["Governments and corporations", "The Lord God Almighty", "Whoever works the hardest", "Nobody"],
                            correctAnswer: 1,
                            explanation: "Everything in creation belongs to God; we are simply stewards entrusted with His wealth."
                        }
                    },
                    {
                        lessonNumber: 11,
                        title: "The Blessing of Tithing & Offerings",
                        scriptureAnchor: "Malachi 3:8-10; 2 Corinthians 9:6-8",
                        objectives: ["Understand the biblical tithe (the first tenth) as holy unto the Lord", "Give cheerful, sacrificial freewill offerings", "Experience God opening the windows of heaven and rebuking the devourer"],
                        memoryVerse: "“Bring all the tithes into the storehouse, that there may be food in My house, and try Me now in this,” says the Lord of hosts... — Malachi 3:10",
                        practicalAction: "Honor God by faithfully setting aside your tithe from your next income for the local church storehouse.",
                        quizQuestion: {
                            question: "How does 2 Corinthians 9:7 describe the kind of giver God loves?",
                            options: ["A grudging and reluctant giver", "A cheerful giver who gives as he purposes in his heart", "Someone forced to give by peer pressure", "A wealthy giver only"],
                            correctAnswer: 1,
                            explanation: "God loves a cheerful giver whose giving springs from heartfelt joy, faith, and thanksgiving."
                        }
                    },
                    {
                        lessonNumber: 12,
                        title: "Debt Freedom, Budgeting & Kingdom Generosity",
                        scriptureAnchor: "Proverbs 22:7; Luke 16:10-12; 1 Timothy 6:6-10",
                        objectives: ["Break free from consumer debt and impulsive spending", "Formulate a simple biblical monthly budget", "Be faithful in handling unrighteous mammon so true riches are entrusted"],
                        memoryVerse: "“He who is faithful in what is least is faithful also in much; and he who is unjust in what is least is unjust also in much.” — Luke 16:10",
                        practicalAction: "Create a simple monthly income and expense tracker, listing any debts to aggressively pay off.",
                        quizQuestion: {
                            question: "What warning does Proverbs 22:7 give about borrowing?",
                            options: ["The borrower is always richer", "The borrower is servant to the lender", "Debt has no spiritual consequences", "Borrowing is the secret to wealth"],
                            correctAnswer: 1,
                            explanation: "Proverbs cautions that debt brings bondage and restricts kingdom freedom, urging faithful financial stewardship."
                        }
                    }
                ]
            },
            {
                moduleNumber: 5,
                title: "Inner Healing, Forgiveness & Relational Peace",
                description: "Overcoming emotional wounds, bitterness, and relational fractures.",
                lessons: [
                    {
                        lessonNumber: 13,
                        title: "The Poison of Bitterness & The Power of Forgiveness",
                        scriptureAnchor: "Ephesians 4:31-32; Hebrews 12:14-15",
                        objectives: ["Recognize that bitterness defiles many and hinders God's grace", "Forgive others as God in Christ forgave you", "Differentiate between forgiveness and immediate trust"],
                        memoryVerse: "“And be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you.” — Ephesians 4:32",
                        practicalAction: "Write down the names of people who deeply wounded you, and pray aloud: 'In Jesus' name, I forgive them and release all debt.'",
                        quizQuestion: {
                            question: "What is the biblical standard for how believers must forgive others (Ephesians 4:32)?",
                            options: ["Only if the other person apologizes first", "Even as God in Christ forgave you", "Only for minor offenses", "Never forgive severe betrayals"],
                            correctAnswer: 1,
                            explanation: "We are commanded to forgive generously based on the immense forgiveness we received from Christ."
                        }
                    },
                    {
                        lessonNumber: 14,
                        title: "Healing from Rejection, Shame & Past Trauma",
                        scriptureAnchor: "Psalm 147:3; Isaiah 53:3-5; Romans 8:1",
                        objectives: ["Receive Christ as the Healer of the broken in heart", "Cast off condemnation and shame in the light of the Cross", "Rejoice in unconditional Father-love"],
                        memoryVerse: "“He heals the brokenhearted and binds up their wounds.” — Psalm 147:3",
                        practicalAction: "Bring your deepest hurt to the Cross in quiet prayer and invite the Holy Spirit to bind up the wound.",
                        quizQuestion: {
                            question: "According to Romans 8:1, how much condemnation exists for those who are in Christ Jesus?",
                            options: ["A little bit for past sins", "There is therefore now NO condemnation to those who are in Christ Jesus", "Condemnation is permanent", "Only temporary condemnation"],
                            correctAnswer: 1,
                            explanation: "In Christ, all condemnation is extinguished through His finished sacrifice on our behalf."
                        }
                    },
                    {
                        lessonNumber: 15,
                        title: "Healthy Christian Communication & Conflict Resolution",
                        scriptureAnchor: "Matthew 18:15-17; Proverbs 15:1",
                        objectives: ["Go directly and privately to a brother who offended you", "Use soft answers that turn away wrath", "Seek reconciliation, not personal vindication"],
                        memoryVerse: "“A soft answer turns away wrath, but a harsh word stirs up anger.” — Proverbs 15:1",
                        practicalAction: "If you have an unresolved disagreement with someone, reach out today to schedule a gentle, private conversation.",
                        quizQuestion: {
                            question: "What is the first step Jesus gave in Matthew 18:15 when a brother sins against you?",
                            options: ["Post about it on social media", "Go and tell him his fault between you and him alone", "Tell all other members first", "Cut off fellowship permanently"],
                            correctAnswer: 1,
                            explanation: "Jesus commanded private, direct dialogue first, seeking to win and restore your brother in love."
                        }
                    }
                ]
            },
            {
                moduleNumber: 6,
                title: "Life Group Community & Graduation to Stage 3",
                description: "Deepening roots in a small group family and preparing to disciple others.",
                lessons: [
                    {
                        lessonNumber: 16,
                        title: "The Biblical Pattern of Small Group Fellowship",
                        scriptureAnchor: "Acts 20:20; Romans 16:3-5",
                        objectives: ["Value the two wings of the church: public temple gatherings and home-to-home cell groups", "Practice the 'one another' commands of Scripture", "Create a safe, authentic environment for spiritual growth"],
                        memoryVerse: "“...how I kept back nothing that was helpful, but proclaimed it to you, and taught you publicly and from house to house.” — Acts 20:20",
                        practicalAction: "Actively encourage and pray for a fellow member in your Life Group this week.",
                        quizQuestion: {
                            question: "What did the apostle Paul teach in Acts 20:20 regarding church ministry venues?",
                            options: ["Only in large public halls", "Publicly and from house to house", "Exclusively through written letters", "Only in monasteries"],
                            correctAnswer: 1,
                            explanation: "The early church flourished through a dual ministry model: large congregational worship and intimate home-to-home cell groups."
                        }
                    },
                    {
                        lessonNumber: 17,
                        title: "Mutual Accountability & Spiritual Friendship",
                        scriptureAnchor: "Ecclesiastes 4:9-12; Proverbs 27:17",
                        objectives: ["Understand that isolation makes a believer easy prey for the enemy", "Develop trusted spiritual friendships where you can be real", "Sharpen one another in doctrine, prayer, and character"],
                        memoryVerse: "“As iron sharpens iron, so a man sharpens the countenance of his friend.” — Proverbs 27:17",
                        practicalAction: "Ask your Life Group leader or mentor to hold you accountable for 1 specific area of spiritual growth.",
                        quizQuestion: {
                            question: "Why does Ecclesiastes 4:10 say it is dangerous to walk alone spiritually?",
                            options: ["Because solitary walking is illegal", "For if they fall, one will lift up his companion; but woe to him who is alone when he falls", "Because walking alone takes longer", "Because it is boring"],
                            correctAnswer: 1,
                            explanation: "Scripture warns that when an isolated person falls, there is no brother or sister beside them to lift them up."
                        }
                    },
                    {
                        lessonNumber: 18,
                        title: "Stage 2 Graduation & Calling to Disciple-Making",
                        scriptureAnchor: "2 Timothy 2:2; Hebrews 5:12-14",
                        objectives: ["Review the 18 Stage 2 Formation milestones", "Transition from being fed to feeding others", "Embrace the call to become a Stage 3 Disciple-Maker"],
                        memoryVerse: "“And the things that you have heard from me among many witnesses, commit these to faithful men who will be able to teach others also.” — 2 Timothy 2:2",
                        practicalAction: "Submit your Stage 2 portfolio and pray for 1 specific person God wants you to mentor in Stage 1.",
                        quizQuestion: {
                            question: "What does Hebrews 5:12 challenge maturing believers to become over time?",
                            options: ["Perpetual spiritual babies requiring only milk", "Teachers and mentors who feed others with solid food", "Critical observers of the church", "Spectators in ministry"],
                            correctAnswer: 1,
                            explanation: "Mature believers are expected to grow from spiritual infants needing milk into teachers of righteousness."
                        }
                    }
                ]
            }
        ]
    },

    // --------------------------------------------------------
    // STAGE 3: EQUIPPING (GEN 3: DISCIPLE-MAKER)
    // --------------------------------------------------------
    {
        stage: 3,
        generationLevel: "Gen 3",
        generationTitle: "Disciple-Maker",
        courseCode: "GEN-301",
        courseTitle: "Ministry Equipping & Disciple-Making",
        subtitle: "The 2 Timothy 2:2 Multiplication Engine: Mentoring & Spiritual Parenting",
        category: "Stage 3 — Equipping",
        targetAudience: "Faithful believers stepping into spiritual parenthood, mentoring newcomers, and co-leading Life Groups",
        totalWeeks: 6,
        totalLessons: 18,
        modulesCount: 6,
        icon: "🌱",
        themeColor: "#ea580c",
        bannerGradient: "linear-gradient(135deg, #c2410c, #ea580c)",
        badgeClass: "stage-3",
        description: "Intensive training in personal evangelism, 1-on-1 discipleship check-ins, discovering spiritual gifts, facilitating small groups, and raising spiritual children.",
        modules: [
            {
                moduleNumber: 1,
                title: "The 2 Timothy 2:2 Discipleship Mandate",
                description: "Understanding the biblical mathematics of generational reproduction.",
                lessons: [
                    {
                        lessonNumber: 1,
                        title: "The Four Generations of Faith",
                        scriptureAnchor: "2 Timothy 2:2; 1 Thessalonians 2:7-8",
                        objectives: ["Identify the 4 generations: Paul (Gen 1) -> Timothy (Gen 2) -> Faithful Men (Gen 3) -> Others Also (Gen 4)", "Shift mindset from addition to exponential multiplication", "Embrace the role of a spiritual parent"],
                        memoryVerse: "“And the things that you have heard from me among many witnesses, commit these to faithful men who will be able to teach others also.” — 2 Timothy 2:2",
                        practicalAction: "Draw your personal spiritual family tree: who discipled you, and whom are you actively discipling right now?",
                        quizQuestion: {
                            question: "How many distinct spiritual generations are identified in 2 Timothy 2:2?",
                            options: ["Two generations", "Four generations: Paul, Timothy, Faithful Men, and Others Also", "Only one generation", "Ten generations"],
                            correctAnswer: 1,
                            explanation: "Paul outlined a 4-generation pipeline that perpetuates gospel leadership across all eras."
                        }
                    },
                    {
                        lessonNumber: 2,
                        title: "Multiplication vs. Addition in Kingdom Growth",
                        scriptureAnchor: "Exodus 18:21; Acts 6:1-7; Matthew 13:23",
                        objectives: ["See why a single pastor cannot personally pastor 500 people alone", "Discover the power of multiplying disciple-makers", "Calculate the generational impact of the 1:3 triad rule"],
                        memoryVerse: "“Then the word of God spread, and the number of the disciples multiplied greatly in Jerusalem...” — Acts 6:7",
                        practicalAction: "Pray specifically for God to entrust you with 3 faithful disciples to mentor over the next 12 months.",
                        quizQuestion: {
                            question: "Why did the apostles in Acts 6 delegate responsibilities to seven faithful men?",
                            options: ["Because they wanted to retire early", "So the Word of God would not be neglected and disciples could multiply", "Because they were tired of preaching", "To save church money"],
                            correctAnswer: 1,
                            explanation: "Delegation and raising up leaders freed the apostles for prayer and the ministry of the Word, causing disciples to multiply greatly."
                        }
                    },
                    {
                        lessonNumber: 3,
                        title: "The Heart of a Spiritual Parent (F.A.T. Disciples)",
                        scriptureAnchor: "1 Corinthians 4:14-16; Luke 16:10",
                        objectives: ["Understand the difference between an instructor and a spiritual father/mother", "Identify F.A.T. disciples: Faithful, Available, Teachable", "Pour your life into those who will reproduce"],
                        memoryVerse: "“For though you might have ten thousand instructors in Christ, yet you do not have many fathers; for in Christ Jesus I have begotten you through the gospel.” — 1 Corinthians 4:15",
                        practicalAction: "Evaluate your disciples using the FAT criteria (Faithful, Available, Teachable) and adjust your mentoring time accordingly.",
                        quizQuestion: {
                            question: "What does the discipleship acronym F.A.T. stand for?",
                            options: ["Fast, Ambitious, Talented", "Faithful, Available, Teachable", "Famous, Active, Traditional", "Fearless, Aggressive, Tough"],
                            correctAnswer: 1,
                            explanation: "Effective discipleship focuses intentional investment on those who are Faithful, Available, and Teachable."
                        }
                    }
                ]
            },
            {
                moduleNumber: 2,
                title: "Discovering & Deploying Spiritual Gifts",
                description: "Helping believers find their unique place of service in the body of Christ.",
                lessons: [
                    {
                        lessonNumber: 4,
                        title: "The Theology of Spiritual Gifts (Charismata)",
                        scriptureAnchor: "1 Corinthians 12:1-11; 1 Peter 4:10",
                        objectives: ["Understand that every true believer has at least one spiritual gift", "Recognize that gifts are given for the common good, not self-exaltation", "Honor the diversity of gifts in the body of Christ"],
                        memoryVerse: "“As each one has received a gift, minister it to one another, as good stewards of the manifold grace of God.” — 1 Peter 4:10",
                        practicalAction: "Take the 15-question Spiritual Gifts Inventory in EPIC Learning to identify your top 3 motivational gifts.",
                        quizQuestion: {
                            question: "What is the primary divine purpose of spiritual gifts according to 1 Corinthians 12:7?",
                            options: ["To show who is the most spiritual", "For the profit and edification of the whole church body", "To earn financial profit", "For private entertainment"],
                            correctAnswer: 1,
                            explanation: "Spiritual gifts are divine empowerments distributed by the Spirit for the mutual profit and upbuilding of the church."
                        }
                    },
                    {
                        lessonNumber: 5,
                        title: "The Seven Motivational Gifts (Romans 12)",
                        scriptureAnchor: "Romans 12:6-8; Ephesians 4:11-12",
                        objectives: ["Analyze the motivational gifts: Prophecy, Serving, Teaching, Exhortation, Giving, Leading, and Mercy", "Recognize your primary spiritual wiring", "Appreciate believers with contrasting giftings"],
                        memoryVerse: "“Having then gifts differing according to the grace that is given to us, let us use them...” — Romans 12:6",
                        practicalAction: "Write down your primary gift and identify 1 specific church ministry department where it can be actively deployed.",
                        quizQuestion: {
                            question: "Which of the following is listed among the motivational gifts in Romans 12:6-8?",
                            options: ["Debating", "Exhortation and Giving with liberality", "Criticizing leaders", "Writing fiction"],
                            correctAnswer: 1,
                            explanation: "Romans 12 highlights vital motivational gifts including prophecy, ministry, teaching, exhortation, giving, leading, and mercy."
                        }
                    },
                    {
                        lessonNumber: 6,
                        title: "Serving with Humility & Guarding Against Spiritual Pride",
                        scriptureAnchor: "1 Corinthians 13:1-3; Luke 17:10",
                        objectives: ["Remember that gifts without love are noisy and spiritually worthless", "Cultivate the servant attitude: 'We have done what was our duty to do'", "Submit spiritual gifts under pastoral leadership and church order"],
                        memoryVerse: "“Though I speak with the tongues of men and of angels, but have not love, I have become sounding brass or a clanging cymbal.” — 1 Corinthians 13:1",
                        practicalAction: "Serve in an unglamorous ministry task this week (e.g. cleaning, ushering, setting up equipment) with genuine love.",
                        quizQuestion: {
                            question: "What does 1 Corinthians 13 declare about spiritual gifts exercised without love?",
                            options: ["They are twice as effective", "They are spiritually empty and profit nothing", "They impress God regardless", "They guarantee salvation"],
                            correctAnswer: 1,
                            explanation: "Love is the indispensable foundation of all authentic Christian ministry and gifts."
                        }
                    }
                ]
            },
            {
                moduleNumber: 3,
                title: "Personal Evangelism & Soul Winning",
                description: "Equipping disciples to lead souls from darkness into the marvelous light.",
                lessons: [
                    {
                        lessonNumber: 7,
                        title: "The Heart of the Soul Winner",
                        scriptureAnchor: "Luke 19:10; Proverbs 11:30; Romans 9:1-3",
                        objectives: ["Cultivate Christ's compassion for the lost and unsaved", "Overcome spiritual apathy and fear of man", "Pray consistently for specific unsaved friends, family, and coworkers"],
                        memoryVerse: "“The fruit of the righteous is a tree of life, and he who wins souls is wise.” — Proverbs 11:30",
                        practicalAction: "Write a 'Top 5 Souls to Win' prayer list on your Church in Action Soul-Winning Prayer List and intercede daily.",
                        quizQuestion: {
                            question: "What was Jesus' central mission statement in Luke 19:10?",
                            options: ["To overthrow political empires", "For the Son of Man has come to seek and to save that which was lost", "To debate religious theologians", "To enjoy physical luxuries"],
                            correctAnswer: 1,
                            explanation: "The heartbeat of Christ was seeking and saving the lost; every disciple is called to share this mission."
                        }
                    },
                    {
                        lessonNumber: 8,
                        title: "The Roman Road & Simple Gospel Outlines",
                        scriptureAnchor: "Romans 3:23; 6:23; 5:8; 10:9-13",
                        objectives: ["Master the 4 stops on the Roman Road: The Need, The Penalty, The Provision, The Response", "Lead a seeker smoothly through the sinner's prayer of repentance", "Avoid confusing theological jargon"],
                        memoryVerse: "“For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.” — Romans 6:23",
                        practicalAction: "Practice sharing the Roman Road outline out loud with a friend until you can share it without notes.",
                        quizQuestion: {
                            question: "What is the third stop on the Roman Road regarding God's provision (Romans 5:8)?",
                            options: ["We must cleanse ourselves first", "God demonstrates His own love toward us, in that while we were still sinners, Christ died for us", "Salvation is only for religious scholars", "God ignores sin"],
                            correctAnswer: 1,
                            explanation: "Romans 5:8 proves God's unconditional love: Christ died for us while we were still helpless sinners."
                        }
                    },
                    {
                        lessonNumber: 9,
                        title: "Handling Objections & Answering Difficult Questions",
                        scriptureAnchor: "Colossians 4:5-6; 2 Timothy 2:24-26",
                        objectives: ["Respond with grace, patience, and seasoned wisdom", "Address common objections: 'Why does God allow suffering?', 'Are all religions the same?'", "Never argue or quarrel; point consistently back to the Cross"],
                        memoryVerse: "“Let your speech always be with grace, seasoned with salt, that you may know how you ought to answer each one.” — Colossians 4:6",
                        practicalAction: "Write out a gracious biblical answer to: 'Why is Jesus the only way to God?' based on John 14:6.",
                        quizQuestion: {
                            question: "How should a servant of the Lord treat those who oppose the gospel (2 Timothy 2:24-25)?",
                            options: ["With sarcasm and loud shouting", "Must not quarrel but be gentle to all, able to teach, patient, in humility correcting those who oppose", "By calling down fire", "By mocking them publicly"],
                            correctAnswer: 1,
                            explanation: "God's servants are called to gentleness, patience, and humble instruction, trusting God to grant repentance."
                        }
                    }
                ]
            },
            {
                moduleNumber: 4,
                title: "How to Conduct a 1-on-1 Discipleship Check-In",
                description: "Mastering the weekly mentoring rhythm outlined in the EPIC Generations Framework.",
                lessons: [
                    {
                        lessonNumber: 10,
                        title: "The Architecture of a 1-on-1 Mentoring Meeting",
                        scriptureAnchor: "1 Thessalonians 5:11; Hebrews 3:12-13",
                        objectives: ["Learn the 45-minute 1-on-1 rhythm: Connect (10m) -> Check Word & Habits (15m) -> Pastoral Care (10m) -> Prayer & Next Step (10m)", "Maintain active listening without dominating the conversation", "Keep the focus centered on spiritual growth and application"],
                        memoryVerse: "“Therefore comfort each other and edify one another, just as you also are doing.” — 1 Thessalonians 5:11",
                        practicalAction: "Conduct your first 1-on-1 check-in with your assigned spiritual child using the Church in Action profile template.",
                        quizQuestion: {
                            question: "What is the primary focus of a weekly 1-on-1 discipleship check-in?",
                            options: ["Checking off religious boxes and criticizing flaws", "Personal encouragement, accountability in Word/prayer, and caring pastoral prayer", "Gossiping about church members", "Collecting money"],
                            correctAnswer: 1,
                            explanation: "The weekly 1-on-1 is an intentional coaching and prayer touchpoint to nurture the disciple's spiritual walk."
                        }
                    },
                    {
                        lessonNumber: 11,
                        title: "Asking Powerful Discipleship Questions",
                        scriptureAnchor: "Proverbs 20:5; Luke 9:18-20",
                        objectives: ["Move beyond surface 'yes/no' answers to heart-level transparency", "Ask open-ended probing questions: 'What did God speak to you through His Word this week?', 'Where are you experiencing spiritual warfare?'", "Create an atmosphere of safety and unconditional love"],
                        memoryVerse: "“Counsel in the heart of man is like deep water, but a man of understanding will draw it out.” — Proverbs 20:5",
                        practicalAction: "Write down 5 open-ended discipleship questions to use in your next meeting.",
                        quizQuestion: {
                            question: "According to Proverbs 20:5, what does a person of understanding do with counsel in another's heart?",
                            options: ["Drowns it with long lectures", "Draws it out like deep water", "Ignores it", "Judges it immediately"],
                            correctAnswer: 1,
                            explanation: "Skilled disciplers ask thoughtful questions that gently draw out what the Holy Spirit is doing in the disciple's heart."
                        }
                    },
                    {
                        lessonNumber: 12,
                        title: "Pastoral Care Boundaries & Confidentiality Safeguards",
                        scriptureAnchor: "Proverbs 11:13; Galatians 6:1-2",
                        objectives: ["Maintain strict confidentiality regarding personal struggles confessed in discipleship", "Never gossip about a disciple under the guise of 'sharing prayer requests'", "Know when a severe issue (abuse, self-harm, legal crisis) must be escalated to the Senior Pastor"],
                        memoryVerse: "“A talebearer reveals secrets, but he who is of a faithful spirit conceals a matter.” — Proverbs 11:13",
                        practicalAction: "Sign and affirm the EPIC Generations Confidentiality Covenant in your Church in Action leader profile.",
                        quizQuestion: {
                            question: "What is the biblical rule regarding private matters shared during discipleship (Proverbs 11:13)?",
                            options: ["Share them with friends immediately", "A faithful spirit conceals a matter with strict confidentiality", "Post them as prayer requests", "Exaggerate them"],
                            correctAnswer: 1,
                            explanation: "Confidentiality builds trust; a faithful mentor protects the confidentiality of their disciples at all times."
                        }
                    }
                ]
            },
            {
                moduleNumber: 5,
                title: "Facilitating a Spirit-Filled Life Group",
                description: "Leading small groups that care, connect, and multiply.",
                lessons: [
                    {
                        lessonNumber: 13,
                        title: "The Anatomy of an Effective Life Group Meeting",
                        scriptureAnchor: "Colossians 3:16; 1 Corinthians 14:26",
                        objectives: ["Implement the 4 W's: Welcome (Icebreaker) -> Worship (Praise) -> Word (Discussion) -> Works (Ministry/Evangelism)", "Facilitate lively group discussions rather than preaching a monologue", "Ensure everyone participates and feels valued"],
                        memoryVerse: "“Let the word of Christ dwell in you richly in all wisdom, teaching and admonishing one another in psalms and hymns...” — Colossians 3:16",
                        practicalAction: "Prepare a 15-minute discussion guide for an upcoming Life Group meeting using the 4 W's framework.",
                        quizQuestion: {
                            question: "What are the 4 W's of an effective Life Group meeting format?",
                            options: ["Waiting, Wandering, Watching, Worrying", "Welcome, Worship, Word, Works", "Work, Wages, Wealth, Walking", "Wisdom, Warfare, Wonder, World"],
                            correctAnswer: 1,
                            explanation: "Welcome, Worship, Word, and Works create a balanced, engaging, and fruitful small group gathering."
                        }
                    },
                    {
                        lessonNumber: 14,
                        title: "Cultivating Warmth, Hospitality & Vulnerability",
                        scriptureAnchor: "Romans 12:13; 1 Peter 4:9; James 5:16",
                        objectives: ["Practice biblical hospitality without grumbling", "Model vulnerability as the leader so members feel safe to open up", "Foster an atmosphere of healing and mutual prayer"],
                        memoryVerse: "“Be hospitable to one another without grumbling.” — 1 Peter 4:9",
                        practicalAction: "Host a fellowship meal or coffee time for your small group members this week to strengthen bonds.",
                        quizQuestion: {
                            question: "What atmosphere is created when a leader models humility and vulnerability?",
                            options: ["Members lose respect", "Members feel safe to be authentic and open their hearts to healing", "The meeting becomes chaotic", "Nobody speaks"],
                            correctAnswer: 1,
                            explanation: "Vulnerability breeds authenticity; when leaders are genuine, members feel safe to share and receive ministry."
                        }
                    },
                    {
                        lessonNumber: 15,
                        title: "Preparing for Group Multiplication",
                        scriptureAnchor: "Genesis 1:28; Acts 9:31",
                        objectives: ["Understand that healthy things naturally grow and multiply", "Cast the vision for birthing a new group from day one", "Identify and train an apprentice co-leader right beside you"],
                        memoryVerse: "“Then God blessed them, and God said to them, 'Be fruitful and multiply; fill the earth and subdue it...'” — Genesis 1:28",
                        practicalAction: "Select 1 faithful apprentice in your group and begin co-leading meetings together.",
                        quizQuestion: {
                            question: "What is the sign of a spiritually healthy small group?",
                            options: ["Remaining the exact same small group forever", "Multiplying into new groups to reach more souls", "Closing the group to outsiders", "Stopping evangelism"],
                            correctAnswer: 1,
                            explanation: "Spiritual health produces reproduction; vibrant groups constantly train new leaders to birth new daughter groups."
                        }
                    }
                ]
            },
            {
                moduleNumber: 6,
                title: "Consolidating New Converts & Stage 3 Graduation",
                description: "Closing the back door of the church by anchoring newcomers in Christ.",
                lessons: [
                    {
                        lessonNumber: 16,
                        title: "The Critical 24-48 Hour Follow-Up Window",
                        scriptureAnchor: "Acts 15:36; Colossians 1:28-29",
                        objectives: ["Contact first-time visitors and converts within 24 to 48 hours", "Validate their contact information and pray with warmth", "Connect them directly to a spiritual parent in the Delegation Center"],
                        memoryVerse: "“Him we preach, warning every man and teaching every man in all wisdom, that we may present every man perfect in Christ Jesus.” — Colossians 1:28",
                        practicalAction: "Follow up with 2 newcomers from Sunday's visitor log within 24 hours and log the check-in in Church in Action.",
                        quizQuestion: {
                            question: "Why is the first 24-48 hours after a newcomer's visit so vital?",
                            options: ["For administrative record keeping only", "The enemy immediately tries to steal the seed; prompt care solidifies their connection", "To invoice them", "Because church rules require it"],
                            correctAnswer: 1,
                            explanation: "Prompt pastoral follow-up guards the newly planted Word from enemy snatching and anchors newcomers in community."
                        }
                    },
                    {
                        lessonNumber: 17,
                        title: "Walking a Disciple Through Water Baptism & Membership",
                        scriptureAnchor: "Acts 2:41; Matthew 28:19",
                        objectives: ["Guide your disciple through the baptism class syllabus", "Accompany them physically to the water on baptism day", "Celebrate their milestone and transition them into church membership"],
                        memoryVerse: "“Then those who gladly received his word were baptized; and that day about three thousand souls were added to them.” — Acts 2:41",
                        practicalAction: "Check the baptism status of your disciples in Church in Action and assist any unbaptized disciple to enroll.",
                        quizQuestion: {
                            question: "What occurred immediately after the 3,000 believed on the day of Pentecost (Acts 2:41)?",
                            options: ["They waited 10 years", "They gladly received his word and were baptized, being added to the church", "They dispersed and never met again", "They formed separate factions"],
                            correctAnswer: 1,
                            explanation: "Hearing the Word and believing was immediately followed by water baptism and commitment to the church family."
                        }
                    },
                    {
                        lessonNumber: 18,
                        title: "Commissioning as an Official Disciple-Maker",
                        scriptureAnchor: "Matthew 28:18-20; 2 Timothy 4:1-5",
                        objectives: ["Review the 18 Stage 3 Equipping competencies", "Receive formal affirmation from pastoral leadership", "Step into the leadership pipeline for Stage 4"],
                        memoryVerse: "“And Jesus came and spoke to them, saying, 'All authority has been given to Me in heaven and on earth. Go therefore and make disciples of all the nations...'” — Matthew 28:18-19",
                        practicalAction: "Submit your Stage 3 Disciple-Maker certification in EPIC Learning and schedule your pastoral commissioning.",
                        quizQuestion: {
                            question: "What authority stands behind the Great Commission (Matthew 28:18)?",
                            options: ["Human military might", "All authority in heaven and on earth given to Jesus Christ", "Local political approval", "None"],
                            correctAnswer: 1,
                            explanation: "The Great Commission is backed by the absolute, supreme cosmic authority of the risen Lord Jesus Christ."
                        }
                    }
                ]
            }
        ]
    },

    // --------------------------------------------------------
    // STAGE 4: LEADERSHIP (GEN 4: MINISTRY LEADER)
    // --------------------------------------------------------
    {
        stage: 4,
        generationLevel: "Gen 4",
        generationTitle: "Ministry Leader",
        courseCode: "GEN-401",
        courseTitle: "Ministry Leadership & Shepherding Mastery",
        subtitle: "Leading Groups, Shepherding Flocks & Exodus 18:21 Governance",
        category: "Stage 4 — Leadership",
        targetAudience: "Life Group leaders, ministry department heads, and pastoral assistants shepherding flocks",
        totalWeeks: 6,
        totalLessons: 18,
        modulesCount: 6,
        icon: "🏛️",
        themeColor: "#9333ea",
        bannerGradient: "linear-gradient(135deg, #7e22ce, #9333ea)",
        badgeClass: "stage-4",
        description: "Advanced pastoral shepherding, servant leadership, crisis intervention, resolving church conflict, and implementing scalable Exodus 18:21 delegation structures.",
        modules: [
            {
                moduleNumber: 1,
                title: "Biblical Servant Leadership Modeled by Christ",
                description: "Embodying the leadership paradigm of the Towel and the Basin.",
                lessons: [
                    {
                        lessonNumber: 1,
                        title: "The Towel & Basin: Mark 10 Leadership",
                        scriptureAnchor: "Mark 10:42-45; John 13:12-17",
                        objectives: ["Reject worldly authoritarian leadership models", "Lead by serving others rather than lording over them", "Wash the feet of those you lead in humble love"],
                        memoryVerse: "“For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many.” — Mark 10:45",
                        practicalAction: "Identify 1 leader under your care and do something practical to serve and honor them this week.",
                        quizQuestion: {
                            question: "How did Jesus redefine leadership greatness in Mark 10:43-44?",
                            options: ["Whoever has the highest title is greatest", "Whoever desires to become great among you shall be your servant", "Whoever collects the most money", "Whoever gives the most orders"],
                            correctAnswer: 1,
                            explanation: "In God's Kingdom, greatness is measured not by how many serve you, but by how many you humbly serve."
                        }
                    },
                    {
                        lessonNumber: 2,
                        title: "The Shepherd's Heart (1 Peter 5)",
                        scriptureAnchor: "1 Peter 5:1-4; Ezekiel 34:11-16",
                        objectives: ["Shepherd the flock of God willingly, not under compulsion", "Lead eagerly, not for dishonest gain or power", "Be examples to the flock as an under-shepherd to the Chief Shepherd"],
                        memoryVerse: "“Shepherd the flock of God which is among you, serving as overseers, not by compulsion but willingly, not for dishonest gain but eagerly...” — 1 Peter 5:2",
                        practicalAction: "Call 3 members of your flock this week specifically to pray for their health, family, and spiritual peace.",
                        quizQuestion: {
                            question: "Who is the Chief Shepherd whom ministry leaders will give an account to (1 Peter 5:4)?",
                            options: ["The denomination president", "Jesus Christ our Lord", "The local mayor", "Church trustees"],
                            correctAnswer: 1,
                            explanation: "Every pastor and ministry leader serves under Jesus Christ, the Chief Shepherd who will reward faithfulness with an unfading crown of glory."
                        }
                    },
                    {
                        lessonNumber: 3,
                        title: "Guarding Character Above Charisma",
                        scriptureAnchor: "1 Timothy 3:1-7; Titus 1:5-9",
                        objectives: ["Understand that giftedness can take you where character cannot sustain you", "Maintain blameless integrity in finances, family, and speech", "Keep personal life aligned with biblical qualifications for overseers"],
                        memoryVerse: "“A bishop then must be blameless, the husband of one wife, temperate, sober-minded, of good behavior, hospitable, able to teach...” — 1 Timothy 3:2",
                        practicalAction: "Conduct an honest self-audit against 1 Timothy 3:1-7 and repent of any hidden inconsistencies.",
                        quizQuestion: {
                            question: "Why does Paul list character qualifications ahead of speaking ability for leaders in 1 Timothy 3?",
                            options: ["Because public speaking doesn't matter", "Character protects the integrity of the gospel and prevents falling into the devil's snare", "It was an arbitrary preference", "Because talent is evil"],
                            correctAnswer: 1,
                            explanation: "A leader's moral and spiritual character safeguards the testimony of the church and prevents reproach from the enemy."
                        }
                    }
                ]
            },
            {
                moduleNumber: 2,
                title: "Exodus 18:21 Governance & Decentralized Delegation",
                description: "Overcoming administrative bottlenecks by empowering leaders of tens, fifties, hundreds, and thousands.",
                lessons: [
                    {
                        lessonNumber: 4,
                        title: "The Jethro Principle: Overcoming Leadership Exhaustion",
                        scriptureAnchor: "Exodus 18:13-26; Numbers 11:14-17",
                        objectives: ["Identify the danger of one leader trying to solve every person's problem", "Recognize that bottlenecks burn out pastors and frustrate congregations", "Embrace Jethro's counsel: 'Both you and these people will wear yourselves out'"],
                        memoryVerse: "“Both you and these people who are with you will surely wear yourselves out. For this thing is too much for you; you are not able to perform it by yourself.” — Exodus 18:18",
                        practicalAction: "Audit your current ministry tasks and identify 2 responsibilities you should delegate to emerging leaders.",
                        quizQuestion: {
                            question: "What warning did Jethro give to Moses when Moses sat alone to judge the people from morning till evening?",
                            options: ["He praised him for working overtime", "You will surely wear yourselves out; this thing is too heavy for you to perform alone", "He told him to resign permanently", "He told him to work faster"],
                            correctAnswer: 1,
                            explanation: "Moses was headed for severe burnout; decentralized delegation was God's ordained solution."
                        }
                    },
                    {
                        lessonNumber: 5,
                        title: "Selecting Leaders of Character (Exodus 18:21)",
                        scriptureAnchor: "Exodus 18:21; Acts 6:3",
                        objectives: ["Evaluate leaders by four biblical criteria: Able men, Fearing God, Men of truth, Hating covetousness", "Appoint leaders over tens, fifties, hundreds, and thousands", "Build a structured coaching span of control"],
                        memoryVerse: "“Moreover you shall select from all the people able men, such as fear God, men of truth, hating covetousness; and place such over them to be rulers of thousands, rulers of hundreds, rulers of fifties, and rulers of tens.” — Exodus 18:21",
                        practicalAction: "Use the Exodus 18:21 matrix in Church in Action to evaluate the leadership readiness of your apprentice leaders.",
                        quizQuestion: {
                            question: "What 4 character traits did Jethro instruct Moses to look for in leaders (Exodus 18:21)?",
                            options: ["Rich, famous, aggressive, handsome", "Able men, such as fear God, men of truth, hating covetousness", "Politically connected, loud, young, wealthy", "None"],
                            correctAnswer: 1,
                            explanation: "Competence ('able'), reverence ('fear God'), integrity ('men of truth'), and financial purity ('hating covetousness') form the biblical standard."
                        }
                    },
                    {
                        lessonNumber: 6,
                        title: "The 1:3 Accountable Triad Span of Care",
                        scriptureAnchor: "Luke 6:12-16; Mark 9:2; 14:33",
                        objectives: ["Observe Jesus' inner circle: Peter, James, and John (the core 3)", "Apply the 1:3 triad rule: every leader actively fathers 3 disciples", "Understand how 1 leader with 3 disciples becomes 9 in Gen 2, 27 in Gen 3, and 81 in Gen 4"],
                        memoryVerse: "“Now when day came, He called His disciples to Himself; and from them He chose twelve whom He also named apostles...” — Luke 6:13",
                        practicalAction: "Ensure your personal discipleship cohort in Church in Action has 3 active, assigned disciples whom you coach weekly.",
                        quizQuestion: {
                            question: "Why is a 1:3 mentoring triad optimal for deep discipleship?",
                            options: ["Because larger groups create chaotic meetings", "It allows deep personal care, authentic modeling, and sustainable multiplication without leader burnout", "It is an arbitrary tradition", "Because 3 is the only lucky number"],
                            correctAnswer: 1,
                            explanation: "Mentoring 3 disciples deeply models Jesus' relationship with Peter, James, and John, creating an exponential yet relationally healthy multiplication tree."
                        }
                    }
                ]
            },
            {
                moduleNumber: 3,
                title: "Pastoral Care, Counseling & Crisis Intervention",
                description: "Shepherding God's people through grief, illness, marital strain, and spiritual crises.",
                lessons: [
                    {
                        lessonNumber: 7,
                        title: "Biblical Pastoral Care & Empathy",
                        scriptureAnchor: "Romans 12:15; 2 Corinthians 1:3-4",
                        objectives: ["Weep with those who weep and rejoice with those who rejoice", "Comfort others with the very comfort you received from God in your afflictions", "Avoid offering cliché answers during intense grief"],
                        memoryVerse: "“Blessed be the God and Father of our Lord Jesus Christ... who comforts us in all our tribulation, that we may be able to comfort those who are in any trouble...” — 2 Corinthians 1:3-4",
                        practicalAction: "Visit or reach out to a suffering church member this week with a caring handwritten note and prayer.",
                        quizQuestion: {
                            question: "According to 2 Corinthians 1:3-4, what is one major purpose of God comforting us in our trials?",
                            options: ["So we can boast about our endurance", "That we may be able to comfort others in any trouble with the comfort we received", "So we never suffer again", "To make us proud"],
                            correctAnswer: 1,
                            explanation: "Our past trials and divine comfort equip us with compassionate empathy to shepherd others through their dark valleys."
                        }
                    },
                    {
                        lessonNumber: 8,
                        title: "Hospital & Home Visitation Etiquette",
                        scriptureAnchor: "Matthew 25:36; James 5:14-16",
                        objectives: ["Conduct sensitive, uplifting hospital and home visits", "Anoint the sick with oil in the name of the Lord and pray the prayer of faith", "Respect medical protocols, family privacy, and patient energy levels"],
                        memoryVerse: "“Is anyone among you sick? Let him call for the elders of the church, and let them pray over him, anointing him with oil in the name of the Lord.” — James 5:14",
                        practicalAction: "Accompany your pastor or seasoned leader on an official hospital or shut-in home visitation.",
                        quizQuestion: {
                            question: "What instruction does James 5:14 give when a believer is seriously sick?",
                            options: ["Keep it a secret", "Call for the elders of the church to pray over him, anointing him with oil in Jesus' name", "Only rely on home remedies", "Assume they did something wrong"],
                            correctAnswer: 1,
                            explanation: "Scripture commands calling church elders/pastoral leaders for united prayer and symbolic anointing with oil in faith."
                        }
                    },
                    {
                        lessonNumber: 9,
                        title: "Pastoral Counseling & Referral Boundaries",
                        scriptureAnchor: "Proverbs 24:6; Galatians 6:2",
                        objectives: ["Provide biblical, scripture-anchored counsel rather than worldly psychology", "Recognize counseling limitations and avoid dual relationships", "Immediately refer complex psychiatric, severe clinical, or domestic violence cases to Senior Pastors and medical professionals"],
                        memoryVerse: "“For by wise counsel you will wage your own war, and in a multitude of counselors there is safety.” — Proverbs 24:6",
                        practicalAction: "Review the Church in Action Counseling Protocol document and understand the pastoral escalation chain.",
                        quizQuestion: {
                            question: "When must a ministry leader immediately refer a counselee to Senior Pastoral leadership?",
                            options: ["Never; solve everything yourself", "Whenever there is physical abuse, suicidal ideation, severe clinical depression, or legal crisis", "Only if the person asks", "Only after 5 years"],
                            correctAnswer: 1,
                            explanation: "Safety, legal compliance, and spiritual duty require immediate escalation of severe crisis situations to senior oversight."
                        }
                    }
                ]
            },
            {
                moduleNumber: 4,
                title: "Church Conflict Resolution & Peacemaking",
                description: "Preserving the unity of the Spirit in the bond of peace.",
                lessons: [
                    {
                        lessonNumber: 10,
                        title: "The Matthew 18 Process for Resolving Offenses",
                        scriptureAnchor: "Matthew 18:15-17; Galatians 6:1",
                        objectives: ["Follow the 3-step Matthew 18 protocol: Private 1-on-1 -> 1-2 Witnesses -> Church Pastoral Authority", "Restore fallen brothers in a spirit of gentleness, considering yourself lest you also be tempted", "Refuse to entertain uncorroborated accusations against leaders"],
                        memoryVerse: "“Brethren, if a man is overtaken in any trespass, you who are spiritual restore such a one in a spirit of gentleness, considering yourself lest you also be tempted.” — Galatians 6:1",
                        practicalAction: "Resolve any lingering tension between members of your ministry flock using the Matthew 18 restorative process.",
                        quizQuestion: {
                            question: "What spiritual spirit must govern the restoration of an erring brother (Galatians 6:1)?",
                            options: ["A spirit of harsh condemnation and public shaming", "A spirit of gentleness, considering yourself lest you also be tempted", "A spirit of gossip", "A spirit of indifference"],
                            correctAnswer: 1,
                            explanation: "Restoration must always be executed in humility, gentleness, and self-awareness of one's own human frailties."
                        }
                    },
                    {
                        lessonNumber: 11,
                        title: "Silencing Gossip & Sowing Harmony",
                        scriptureAnchor: "Proverbs 6:16-19; Proverbs 26:20",
                        objectives: ["Recognize that sowing discord among brethren is an abomination to the Lord", "Shut down gossip immediately: 'Have you spoken directly with that person first?'", "Guard the unity of the leadership team at all costs"],
                        memoryVerse: "“Where there is no wood, the fire goes out; and where there is no talebearer, strife ceases.” — Proverbs 26:20",
                        practicalAction: "Memorize the response: 'Out of honor for our brother, let's stop this conversation and encourage you to speak with them directly.'",
                        quizQuestion: {
                            question: "What does Proverbs 26:20 compare stopping a talebearer (gossiper) to?",
                            options: ["Pouring gasoline on a fire", "A fire going out where there is no wood", "Building a fortress", "Digging a pit"],
                            correctAnswer: 1,
                            explanation: "Without the fuel of gossip and talebearing, strife and church division naturally die out."
                        }
                    },
                    {
                        lessonNumber: 12,
                        title: "Reconciliation, Restitution & Restored Fellowship",
                        scriptureAnchor: "2 Corinthians 2:6-11; Philemon 1:17-19",
                        objectives: ["Confirm your love toward those who have repented after discipline", "Prevent the enemy from outwitting the church through overmuch sorrow or unforgiveness", "Reintegrate restored believers into loving fellowship"],
                        memoryVerse: "“Therefore I urge you to reaffirm your love to him... lest Satan should take advantage of us; for we are not ignorant of his devices.” — 2 Corinthians 2:8-11",
                        practicalAction: "Reach out with warmth to someone who recently returned to church after a period of absence or discipline.",
                        quizQuestion: {
                            question: "Why did Paul urge the Corinthian church to forgive and reaffirm love to a repentant brother in 2 Corinthians 2:11?",
                            options: ["Because rules don't matter", "Lest Satan should take advantage of us, for we are not ignorant of his devices", "To look modern", "Because God was tired of discipline"],
                            correctAnswer: 1,
                            explanation: "Unforgiveness gives Satan a tactical foothold to swallow believers in despair and fracture church harmony."
                        }
                    }
                ]
            },
            {
                moduleNumber: 5,
                title: "Multiplying Life Groups & Raising New Leaders",
                description: "Birthing healthy daughter cells and empowering emerging facilitators.",
                lessons: [
                    {
                        lessonNumber: 13,
                        title: "The Mechanics of Cell Multiplication",
                        scriptureAnchor: "Acts 2:46-47; Acts 5:42",
                        objectives: ["Plan group multiplication when regular attendance exceeds 12-15 members", "Avoid emotional attachment that prevents healthy birthing", "Celebrate the birth of daughter groups with prayer and blessing"],
                        memoryVerse: "“And daily in the temple, and in every house, they did not cease teaching and preaching Jesus as the Christ.” — Acts 5:42",
                        practicalAction: "Create a multiplication timeline for your Life Group targeting an apprentice leader to launch a daughter group.",
                        quizQuestion: {
                            question: "What is the optimal size range before a Life Group should multiply into two groups?",
                            options: ["Over 100 members", "When consistent attendance reaches 12 to 15 members", "Never multiply; keep everyone together", "Only when forced by government"],
                            correctAnswer: 1,
                            explanation: "Groups exceeding 12-15 lose intimate interaction; multiplication preserves deep personal care and creates new leadership opportunities."
                        }
                    },
                    {
                        lessonNumber: 14,
                        title: "The Apprentice Leadership Development Pathway",
                        scriptureAnchor: "2 Timothy 2:2; Mark 3:13-15",
                        objectives: ["Implement the 4-step apprenticeship model: 1. I do, you watch; 2. I do, you help; 3. You do, I help; 4. You do, someone else watches", "Debrief every meeting with your apprentice for constructive feedback", "Release them into full leadership with confidence"],
                        memoryVerse: "“And He went up on the mountain and called to Him those He Himself wanted. And they came to Him. Then He appointed twelve, that they might be with Him and that He might send them out...” — Mark 3:13-14",
                        practicalAction: "Meet with your apprentice 15 minutes before and after this week's group meeting to plan and debrief.",
                        quizQuestion: {
                            question: "What was Jesus' first step in training the twelve disciples in Mark 3:14?",
                            options: ["He sent them away immediately", "That they might be with Him (apprenticeship by proximity)", "He gave them written textbooks only", "He had them observe from a great distance"],
                            correctAnswer: 1,
                            explanation: "Jesus mentored through close proximity and shared life ('that they might be with Him') before sending them out."
                        }
                    },
                    {
                        lessonNumber: 15,
                        title: "The Cluster Review & Leadership Accountability Rhythms",
                        scriptureAnchor: "Hebrews 13:17; Proverbs 27:23",
                        objectives: ["Submit monthly discipleship and flock progress reports in Church in Action", "Participate actively in monthly leaders' coaching huddles", "Know the state of your flocks and attend to your herds"],
                        memoryVerse: "“Be diligent to know the state of your flocks, and attend to your herds.” — Proverbs 27:23",
                        practicalAction: "Complete and submit your monthly Life Group attendance, spiritual health, and next-step report in Church in Action.",
                        quizQuestion: {
                            question: "According to Proverbs 27:23, what responsibility rests upon a faithful leader?",
                            options: ["Ignore details and focus only on visions", "Be diligent to know the state of your flocks and attend to your herds", "Count only monetary offerings", "Blame others for poor outcomes"],
                            correctAnswer: 1,
                            explanation: "A true shepherd keeps diligent, accurate track of the spiritual condition and progress of every member in their care."
                        }
                    }
                ]
            },
            {
                moduleNumber: 6,
                title: "Vision Casting, Team Administration & Stage 4 Graduation",
                description: "Organizing departments, casting kingdom vision, and stepping into Stage 5.",
                lessons: [
                    {
                        lessonNumber: 16,
                        title: "Biblical Vision Casting & Communicating Purpose",
                        scriptureAnchor: "Habakkuk 2:2-3; Nehemiah 2:17-18",
                        objectives: ["Write the vision and make it plain on tablets so he may run who reads it", "Cast vision that inspires sacrificial commitment, not mere duty", "Keep your ministry team aligned with church-wide Great Commission goals"],
                        memoryVerse: "“Then the Lord answered me and said: 'Write the vision and make it plain on tablets, that he may run who reads it.'” — Habakkuk 2:2",
                        practicalAction: "Draft a 1-page annual vision summary for your ministry flock or department, outlining specific spiritual goals.",
                        quizQuestion: {
                            question: "Why did God command the prophet Habakkuk to make the vision plain?",
                            options: ["So it could be buried in a vault", "That he may run who reads it (motivating clear action)", "To win a writing award", "So nobody could understand it"],
                            correctAnswer: 1,
                            explanation: "Clear, plain vision mobilizes people to action, aligns collective energy, and sustains momentum."
                        }
                    },
                    {
                        lessonNumber: 17,
                        title: "Church Administration, Reporting & Ethics",
                        scriptureAnchor: "1 Corinthians 14:40; 2 Corinthians 8:20-21",
                        objectives: ["Let all things be done decently and in biblical order", "Provide honorable things, not only in the sight of the Lord but in the sight of men", "Manage church records, attendance databases, and ministry schedules with excellence"],
                        memoryVerse: "“Let all things be done decently and in order.” — 1 Corinthians 14:40",
                        practicalAction: "Organize your ministry rosters and calendar in the Church in Action platform with complete accuracy.",
                        quizQuestion: {
                            question: "What apostolic standard did Paul give in 1 Corinthians 14:40 for church operations?",
                            options: ["Let everything be haphazard and spontaneous without planning", "Let all things be done decently and in order", "Do whatever is fastest", "Only administrators need order"],
                            correctAnswer: 1,
                            explanation: "God is not the author of confusion; excellence, order, and decency honor the Lord in all church administrative affairs."
                        }
                    },
                    {
                        lessonNumber: 18,
                        title: "Stage 4 Graduation & Readiness for Generational Multiplication",
                        scriptureAnchor: "2 Timothy 4:5; 1 Corinthians 15:58",
                        objectives: ["Review the 18 Stage 4 Leadership competencies", "Affirm successful multiplication of at least one Life Group", "Graduate into Stage 5 Movement Leadership and strategic oversight"],
                        memoryVerse: "“Therefore, my beloved brethren, be steadfast, immovable, always abounding in the work of the Lord, knowing that your labor is not in vain in the Lord.” — 1 Corinthians 15:58",
                        practicalAction: "Complete your Stage 4 Leadership practicum assessment and schedule your pastoral review for Stage 5 entry.",
                        quizQuestion: {
                            question: "What assurance does 1 Corinthians 15:58 give to faithful ministry servants?",
                            options: ["That ministry will always be popular", "That your labor is NOT in vain in the Lord", "That you will never feel tired", "That earthly rewards are guaranteed immediately"],
                            correctAnswer: 1,
                            explanation: "Every prayer, sacrifice, and hour invested in discipling souls and building God's Kingdom carries eternal, unfading value."
                        }
                    }
                ]
            }
        ]
    },

    // --------------------------------------------------------
    // STAGE 5: MULTIPLICATION (GEN 5: MOVEMENT LEADER)
    // --------------------------------------------------------
    {
        stage: 5,
        generationLevel: "Gen 5",
        generationTitle: "Movement Leader",
        courseCode: "GEN-501",
        courseTitle: "Generational Multiplication & Movement Building",
        subtitle: "Apostolic Vision, Cluster Hubs & 2 Timothy 2:2 Kingdom Movements",
        category: "Stage 5 — Multiplication",
        targetAudience: "Senior pastors, movement catalysts, cluster directors, and ordained ministry overseers",
        totalWeeks: 6,
        totalLessons: 18,
        modulesCount: 6,
        icon: "👑",
        themeColor: "#d97706",
        bannerGradient: "linear-gradient(135deg, #b45309, #d97706)",
        badgeClass: "stage-5",
        description: "Equipping movement leaders to build multigenerational discipleship lineages, establish scalable cluster hubs, plant church outposts, and pass the mantle of leadership to the next generation.",
        modules: [
            {
                moduleNumber: 1,
                title: "Apostolic Vision & Movement Dynamics",
                description: "Transitioning from running programs to fueling a church-wide discipleship movement.",
                lessons: [
                    {
                        lessonNumber: 1,
                        title: "Anatomy of a Biblical Movement",
                        scriptureAnchor: "Acts 19:8-10; Acts 6:7",
                        objectives: ["Study Paul's 2-year ministry in the School of Tyrannus: 'all who dwelt in Asia heard the Word'", "Distinguish between static church maintenance and an expanding apostolic movement", "Align the whole church system behind generational discipleship"],
                        memoryVerse: "“And this continued for two years, so that all who dwelt in Asia heard the word of the Lord Jesus, both Jews and Greeks.” — Acts 19:10",
                        practicalAction: "Evaluate your church's annual calendar and prune any activity that does not contribute to making disciples.",
                        quizQuestion: {
                            question: "What was the astonishing result of Paul's daily discipleship training in Ephesus (Acts 19:10)?",
                            options: ["Only 12 people attended", "All who dwelt in Asia heard the word of the Lord Jesus within 2 years", "The church ran out of funds", "They ceased public meetings"],
                            correctAnswer: 1,
                            explanation: "Intentional daily discipleship multiplied leaders who evangelized an entire Roman province in just two years."
                        }
                    },
                    {
                        lessonNumber: 2,
                        title: "Multiplying Across Four Generations (2 Tim 2:2 Heritage)",
                        scriptureAnchor: "2 Timothy 2:2; Psalm 78:5-7",
                        objectives: ["Track lineage depth from Gen 1 to Gen 5 in the Church in Action tree", "Celebrate spiritual grandchildren and great-grandchildren in the faith", "Ensure doctrine and core values remain uncompromised down the generations"],
                        memoryVerse: "“That the generation to come might know them, the children who would be born, that they may arise and declare them to their children...” — Psalm 78:6",
                        practicalAction: "Inspect your church's Generational Family Tree in Church in Action and identify which branches have reached 4th generation depth.",
                        quizQuestion: {
                            question: "Why did God command generational storytelling in Psalm 78:5-7?",
                            options: ["To glorify human ancestors", "That the generation to come might set their hope in God and not forget His works", "To create genealogies for legal rights", "To preserve folklore"],
                            correctAnswer: 1,
                            explanation: "Generational transmission of faith ensures our children and their children set their hope firmly in God."
                        }
                    },
                    {
                        lessonNumber: 3,
                        title: "The Velocity & Health of Discipleship Ratios",
                        scriptureAnchor: "Matthew 13:8; 1 Corinthians 3:6-9",
                        objectives: ["Measure what truly matters: spiritual growth, faithful service, emerging leaders (Section 10)", "Analyze the 1:3 multiplication ratio across departments", "Identify stalled branches and provide intentional coaching interventions"],
                        memoryVerse: "“I planted, Apollos watered, but God gave the increase. So then neither he who plants is anything, nor he who waters, but God who gives the increase.” — 1 Corinthians 3:6-7",
                        practicalAction: "Review the Multiplication Ratio Matrix in Church in Action and schedule a coaching session with a branch needing renewal.",
                        quizQuestion: {
                            question: "Who alone produces genuine spiritual increase in the discipleship tree (1 Corinthians 3:7)?",
                            options: ["Human cleverness and marketing", "God who gives the increase", "The most eloquent speaker", "Large budgets"],
                            correctAnswer: 1,
                            explanation: "Human leaders faithfully plant and water, but supernatural spiritual growth is solely the work of Almighty God."
                        }
                    }
                ]
            },
            {
                moduleNumber: 2,
                title: "Establishing Scalable Cluster Hubs",
                description: "Organizing departmental flocks into self-sustaining cluster ecosystems.",
                lessons: [
                    {
                        lessonNumber: 4,
                        title: "The Cluster Hub Architecture (Flocks of Hundreds)",
                        scriptureAnchor: "Exodus 18:25; Mark 6:39-40",
                        objectives: ["Organize groups into regional and departmental clusters (Adult, Youth, Young Adult, Pastoral)", "Empower Cluster Pastors and Coordinators to shepherd 5-10 Life Group leaders", "Maintain deep pastoral coverage over hundreds without administrative overload"],
                        memoryVerse: "“Then He commanded them to make them all sit down in groups on the green grass. So they sat down in ranks, in hundreds and in fifties.” — Mark 6:39-40",
                        practicalAction: "Review the Groups & Clusters tab in Church in Action and ensure every leader is mapped to a functioning cluster.",
                        quizQuestion: {
                            question: "How did Jesus organize the massive crowd of 5,000 before miraculous feeding (Mark 6:39-40)?",
                            options: ["In a chaotic free-for-all", "In structured ranks and groups of hundreds and fifties", "He sent everyone away immediately", "He fed only the first row"],
                            correctAnswer: 1,
                            explanation: "Jesus introduced divine order—seating people in ranks of hundreds and fifties—enabling swift, organized ministry without chaos."
                        }
                    },
                    {
                        lessonNumber: 5,
                        title: "Cluster Coaching Rhythms & Monthly Leader Huddles",
                        scriptureAnchor: "Acts 20:17-18; 2 Timothy 2:24-26",
                        objectives: ["Design powerful 90-minute monthly cluster huddles: Vision, Skill Sharpening, Care Review, Intercession", "Use real data from Church in Action to address follower needs", "Build deep camaraderie among front-line leaders"],
                        memoryVerse: "“You know, from the first day that I came to Asia, in what manner I always lived among you...” — Acts 20:18",
                        practicalAction: "Plan the agenda for your cluster's next monthly leaders coaching huddle using the framework template.",
                        quizQuestion: {
                            question: "What is the primary deliverable of a monthly leaders' coaching huddle?",
                            options: ["Reading financial spreadsheets for 2 hours", "Leadership skill sharpening, doctrinal alignment, pastoral care review, and spiritual encouragement", "Criticizing struggling leaders", "Collecting dues"],
                            correctAnswer: 1,
                            explanation: "Monthly coaching huddles fuel, sharpen, and pastor the leaders who shepherd the congregation."
                        }
                    },
                    {
                        lessonNumber: 6,
                        title: "Maintaining Purity of Doctrine Across Decentralized Clusters",
                        scriptureAnchor: "Titus 1:9; 2 Timothy 1:13-14",
                        objectives: ["Hold fast the faithful Word as taught so leaders can exhort in sound doctrine and refute detractors", "Guard against false teachings, legalism, and unbiblical trends", "Implement unified curriculum through EPIC Learning across all cell groups"],
                        memoryVerse: "“Hold fast the pattern of sound words which you have heard from me, in faith and love which are in Christ Jesus.” — 2 Timothy 1:13",
                        practicalAction: "Audit your small group curriculum materials to ensure strict alignment with sound biblical doctrine.",
                        quizQuestion: {
                            question: "What charge did Paul give Timothy regarding sound doctrine in 2 Timothy 1:13?",
                            options: ["Change it to suit popular culture", "Hold fast the pattern of sound words in faith and love in Christ Jesus", "Discard past teachings", "Only teach philosophy"],
                            correctAnswer: 1,
                            explanation: "Sound doctrine is a sacred deposit entrusted to faithful leaders to preserve and transmit uncorrupted."
                        }
                    }
                ]
            },
            {
                moduleNumber: 3,
                title: "Fathering, Coaching & Sustaining Ministry Leaders",
                description: "Nurturing the spiritual, emotional, and physical resilience of pastoral workers.",
                lessons: [
                    {
                        lessonNumber: 7,
                        title: "Preventing Pastoral Burnout & Compassion Fatigue",
                        scriptureAnchor: "1 Kings 19:4-8; Mark 6:31",
                        objectives: ["Recognize early symptoms of ministry exhaustion, emotional depletion, and spiritual dryness", "Implement the biblical Sabbath and personal retreat rhythms", "Learn from Elijah under the broom tree: physical rest, nourishing food, and the still small voice of God"],
                        memoryVerse: "“And He said to them, 'Come aside by yourselves to a deserted place and rest a while.' For there were many coming and going, and they did not even have time to eat.” — Mark 6:31",
                        practicalAction: "Schedule a mandatory 24-hour Sabbath rest this week with zero ministry emails or phone calls.",
                        quizQuestion: {
                            question: "What did Jesus command His overworked apostles when ministry became intensely hectic (Mark 6:31)?",
                            options: ["Work twice as hard without sleep", "Come aside by yourselves to a deserted place and rest a while", "Quit the ministry permanently", "Preach louder"],
                            correctAnswer: 1,
                            explanation: "Jesus modeled holy rest as an essential discipline for sustainable kingdom ministry."
                        }
                    },
                    {
                        lessonNumber: 8,
                        title: "Spiritual Fatherhood: Nurturing Next-Gen Pioneers",
                        scriptureAnchor: "Philippians 2:19-22; 1 Thessalonians 2:11-12",
                        objectives: ["Transition from managing employees to fathering sons and daughters in the faith", "Rejoice when your spiritual children surpass your achievements", "Provide a safety net of grace when emerging leaders make honest mistakes"],
                        memoryVerse: "“...as you know how we exhorted, and comforted, and charged every one of you, as a father does his own children, that you would walk worthy of God...” — 1 Thessalonians 2:11-12",
                        practicalAction: "Write a letter or prayer of heartfelt blessing to an emerging leader affirming their calling and gifts.",
                        quizQuestion: {
                            question: "How did Paul describe Timothy's relationship to him in Philippians 2:22?",
                            options: ["A hired servant who worked for wages", "As a son with his father he served with me in the gospel", "A casual acquaintance", "A competitor for ministry prestige"],
                            correctAnswer: 1,
                            explanation: "Paul and Timothy functioned as spiritual father and son in deep covenant love and mutual honor."
                        }
                    },
                    {
                        lessonNumber: 9,
                        title: "Guarding Moral Integrity in Senior Leadership",
                        scriptureAnchor: "1 Corinthians 9:24-27; Proverbs 4:23",
                        objectives: ["Discipline the body and bring it into subjection, lest after preaching to others, you become disqualified", "Establish personal transparency with a board of peer elders", "Flee sexual temptation, financial secrecy, and authoritarian pride"],
                        memoryVerse: "“Keep your heart with all diligence, for out of it spring the issues of life.” — Proverbs 4:23",
                        practicalAction: "Identify 2 trusted senior peers with whom you have absolute, unhindered transparency regarding finances and thought life.",
                        quizQuestion: {
                            question: "What solemn warning did the apostle Paul give in 1 Corinthians 9:27?",
                            options: ["Pastors can never fall", "I discipline my body and bring it into subjection, lest when I have preached to others, I myself should become disqualified", "Public success excuses personal sin", "Nobody needs accountability"],
                            correctAnswer: 1,
                            explanation: "Even the mighty apostle Paul exercised strict personal self-discipline to prevent spiritual disqualification."
                        }
                    }
                ]
            },
            {
                moduleNumber: 4,
                title: "Church Planting, Outposts & Community Transformation",
                description: "Expanding the kingdom frontier beyond the four walls of the local church.",
                lessons: [
                    {
                        lessonNumber: 10,
                        title: "The Theology of Church Planting & Outposts",
                        scriptureAnchor: "Matthew 16:18; Acts 13:1-4; Titus 1:5",
                        objectives: ["See church planting as the most effective evangelistic methodology known", "Commission apostolic teams to launch cell outposts in unreached barangays", "Lay biblical foundations that resist cultural compromise"],
                        memoryVerse: "“...and on this rock I will build My church, and the gates of Hades shall not prevail against it.” — Matthew 16:18",
                        practicalAction: "Identify 1 target barangay or unchurched community and begin weekly prayer-walking with an outreach team.",
                        quizQuestion: {
                            question: "What divine promise did Jesus give regarding His church in Matthew 16:18?",
                            options: ["It will collapse under opposition", "The gates of Hades shall not prevail against it", "It is only a temporary Old Testament idea", "It is built on human strength"],
                            correctAnswer: 1,
                            explanation: "Christ promised that His church is invincible against all the powers of darkness and hell."
                        }
                    },
                    {
                        lessonNumber: 11,
                        title: "Community Outreach & Salt-and-Light Transformation",
                        scriptureAnchor: "Matthew 5:13-16; Jeremiah 29:7; Galatians 6:10",
                        objectives: ["Demonstrate the gospel through compassionate service (feeding, medical missions, relief)", "Seek the peace and prosperity of your city and barangay", "Let your light so shine before men that they see your good works and glorify your Father in heaven"],
                        memoryVerse: "“Let your light so shine before men, that they may see your good works and glorify your Father in heaven.” — Matthew 5:16",
                        practicalAction: "Coordinate a practical community mercy outreach (e.g. food distribution, street clean-up) for your cluster this month.",
                        quizQuestion: {
                            question: "Why should believers engage in good works in their community according to Matthew 5:16?",
                            options: ["To earn government medals", "That men may see your good works and glorify your Father in heaven", "To show we are superior to others", "To gain political offices"],
                            correctAnswer: 1,
                            explanation: "Compassionate good works validate the gospel message and point people toward glorifying the Father in heaven."
                        }
                    },
                    {
                        lessonNumber: 12,
                        title: "Mobilizing Marketplace Disciples",
                        scriptureAnchor: "Colossians 3:23-24; Daniel 6:3-4",
                        objectives: ["Equip Christians in business, education, healthcare, and civil service as ministers of Christ in the marketplace", "Demonstrate Daniel-like excellence and incorruptible integrity on the job", "Turn workplaces into fertile fields for evangelism and discipleship"],
                        memoryVerse: "“And whatever you do, do it heartily, as to the Lord and not to men, knowing that from the Lord you will receive the reward of the inheritance...” — Colossians 3:23-24",
                        practicalAction: "Host a Marketplace Discipleship breakfast or huddle to equip professionals in your congregation.",
                        quizQuestion: {
                            question: "What distinguished Daniel in the secular Persian government (Daniel 6:3-4)?",
                            options: ["Political corruption and bribes", "An excellent spirit was in him; he was faithful, neither was there any error or fault found in him", "He hid his faith completely", "He compromised on God's laws"],
                            correctAnswer: 1,
                            explanation: "Daniel proved that unwavering faith combined with professional excellence exerts extraordinary kingdom influence in secular spheres."
                        }
                    }
                ]
            },
            {
                moduleNumber: 5,
                title: "Commissioning, Sending & Kingdom Multiplication",
                description: "Releasing prepared leaders into their calling and sending out pioneers.",
                lessons: [
                    {
                        lessonNumber: 13,
                        title: "The Biblical Ordination & Commissioning Ceremony",
                        scriptureAnchor: "Acts 13:2-3; 1 Timothy 4:14",
                        objectives: ["Follow the Antioch model: Fasting, praying, and laying on of hands to send out leaders", "Affirm divine callings with the authority of the pastoral presbytery", "Release leaders with ongoing prayer and relational accountability"],
                        memoryVerse: "“Then, having fasted and prayed, and laid hands on them, they sent them away.” — Acts 13:3",
                        practicalAction: "Prepare candidates for the upcoming Church in Action commissioning service using the readiness checklist.",
                        quizQuestion: {
                            question: "What did the church at Antioch do before commissioning Barnabas and Saul in Acts 13:3?",
                            options: ["They voted by majority opinion", "They fasted, prayed, laid hands on them, and sent them away", "They took out bank loans", "They asked permission from Rome"],
                            correctAnswer: 1,
                            explanation: "Biblical commissioning is an act of spiritual consecration through fasting, prayer, and apostolic laying on of hands."
                        }
                    },
                    {
                        lessonNumber: 14,
                        title: "Shepherding Sent Leaders from Afar",
                        scriptureAnchor: "Philippians 1:3-7; Colossians 2:5",
                        objectives: ["Maintain continuous pastoral coaching for church planters and commissioned ministers", "Provide emotional support, prayer covering, and theological counsel", "Foster network fellowship so sent pioneers never feel abandoned"],
                        memoryVerse: "“For though I am absent in the flesh, yet I am with you in spirit, rejoicing to see your good order and the steadfastness of your faith in Christ.” — Colossians 2:5",
                        practicalAction: "Schedule a monthly Zoom or phone coaching check-in with a missionary or sent out pioneer leader.",
                        quizQuestion: {
                            question: "How did Paul remain connected with disciples in distant cities (Colossians 2:5)?",
                            options: ["He completely forgot about them", "He was with them in spirit, praying, writing letters, and sending ministry coworkers", "He only contacted them if they sent money", "He demanded they return immediately"],
                            correctAnswer: 1,
                            explanation: "Paul nurtured lifelong covenantal relationships with his sent spiritual children through letters, prayer, and pastoral visits."
                        }
                    },
                    {
                        lessonNumber: 15,
                        title: "Kingdom Synergy & Inter-Church Fellowship",
                        scriptureAnchor: "John 17:20-23; Ephesians 4:1-6",
                        objectives: ["Pray for and partner with other bible-believing evangelical churches in your region", "Reject territorial jealousy and sectarian competition", "Demonstrate the unity Jesus prayed for in John 17 so the world may believe"],
                        memoryVerse: "“...that they all may be one, as You, Father, are in Me, and I in You; that they also may be one in Us, that the world may believe that You sent Me.” — John 17:21",
                        practicalAction: "Reach out to a fellow pastor or leader in your local city ministerial fellowship to pray together this month.",
                        quizQuestion: {
                            question: "What did Jesus state would be the direct result of church unity in John 17:21?",
                            options: ["The church will have the largest buildings", "That the world may believe that the Father sent Jesus Christ", "All theological discussions will end", "All churches will look identical"],
                            correctAnswer: 1,
                            explanation: "Christlike unity among believers is the most compelling apologetic that convinces the watching world that Jesus is truly the Savior sent by God."
                        }
                    }
                ]
            },
            {
                moduleNumber: 6,
                title: "Generational Succession & Eternal Legacy",
                description: "Passing the baton of leadership faithfully into the hands of the next generation.",
                lessons: [
                    {
                        lessonNumber: 16,
                        title: "Passing the Mantle: Moses to Joshua / Paul to Timothy",
                        scriptureAnchor: "Deuteronomy 34:9; 2 Timothy 4:6-8",
                        objectives: ["Recognize that success without a successor is ultimate failure", "Plan proactive leadership succession years before transition", "Lay hands on the next generation and transfer spiritual authority with joy"],
                        memoryVerse: "“Now Joshua the son of Nun was full of the spirit of wisdom, for Moses had laid his hands on him; so the children of Israel obeyed him...” — Deuteronomy 34:9",
                        practicalAction: "Draft a 5-year succession transition map for your key leadership positions.",
                        quizQuestion: {
                            question: "Why was Joshua full of the spirit of wisdom (Deuteronomy 34:9)?",
                            options: ["Because he studied in Egypt", "Because Moses had laid his hands on him in spiritual succession", "Because he was the oldest man", "Because he demanded it"],
                            correctAnswer: 1,
                            explanation: "Spiritual succession transfers divine wisdom and calling through faithful mentoring and the laying on of hands."
                        }
                    },
                    {
                        lessonNumber: 17,
                        title: "Finishing the Race with Joy",
                        scriptureAnchor: "2 Timothy 4:7-8; Acts 20:24",
                        objectives: ["Fight the good fight, finish the race, and keep the faith", "Count not your life dear to yourself so you may finish your course with joy", "Anticipate the crown of righteousness prepared by the righteous Judge"],
                        memoryVerse: "“I have fought the good fight, I have finished the race, I have kept the faith. Finally, there is laid up for me the crown of righteousness...” — 2 Timothy 4:7-8",
                        practicalAction: "Write your personal ministry purpose statement and recommit to finishing your divine assignment faithfully.",
                        quizQuestion: {
                            question: "What 3 declarations did the apostle Paul make near the end of his earthly life (2 Timothy 4:7)?",
                            options: ["I made a lot of money, built great monuments, and retired", "I have fought the good fight, I have finished the race, I have kept the faith", "I gave up when trials arrived", "I regretted following Jesus"],
                            correctAnswer: 1,
                            explanation: "Paul lived and finished with supreme faithfulness: fighting the good fight, completing the race, and keeping the faith unblemished."
                        }
                    },
                    {
                        lessonNumber: 18,
                        title: "The Ultimate Vision: Every Disciple a Disciple-Maker",
                        scriptureAnchor: "Revelation 7:9-12; Matthew 28:19-20",
                        objectives: ["Catch the grand celestial vision of a multitude no one can count from every tribe, tongue, and nation before the Throne", "Affirm the EPIC Generations vision: Every Disciple a Disciple-Maker, Every Generation a Leadership Legacy", "Rejoice as faithful stewards who multiplied the Master's kingdom"],
                        memoryVerse: "“After these things I looked, and behold, a great multitude which no one could number, of all nations, tribes, peoples, and tongues, standing before the throne and before the Lamb...” — Revelation 7:9",
                        practicalAction: "Pray a prayer of thanksgiving for every disciple and generation that will follow in your spiritual lineage until Christ returns.",
                        quizQuestion: {
                            question: "What is the glorious culmination of all discipleship depicted in Revelation 7:9?",
                            options: ["An empty heaven", "A great multitude which no one could number from all nations, tribes, and tongues worshiping the Lamb", "A small private club", "Only angels singing"],
                            correctAnswer: 1,
                            explanation: "The Great Commission will triumph; the eternal reward is an innumerable company from every nation worshiping the Lamb of God forever."
                        }
                    }
                ]
            }
        ]
    }
];

// ============================================================
// SYSTEMATIC LEARNING & PROGRESS BRIDGE API
// ============================================================

export interface DiscipleCurriculumStatus {
    memberId: number;
    memberName: string;
    stage: 1 | 2 | 3 | 4 | 5;
    stageName: string;
    generationLevel: string;
    currentCourseCode: string;
    currentCourseTitle: string;
    currentLessonNumber: number;
    currentLessonTitle: string;
    completedLessonsCount: number;
    totalLessonsCount: number;
    progressPercentage: number;
    gradeScore: number | null;
    isCertified: boolean;
    mentorName: string;
    lastActivityDate: string;
}

export const epicGenerationsCurriculumService = {
    /**
     * Storage key for unified LMS & Discipleship Roster
     */
    getStorageKey(): string {
        const custId = (typeof localStorage !== "undefined" && localStorage.getItem("customerId")) || "1";
        return `epic_discipleship_roster_cust_${custId}`;
    },

    /**
     * Get the full curriculum definitions (all 5 stages)
     */
    getAllCurriculumPrograms(): DiscipleshipCourseProgram[] {
        return EPIC_GENERATIONS_CURRICULUM;
    },

    /**
     * Get specific stage program (1 to 5)
     */
    getProgramByStage(stage: 1 | 2 | 3 | 4 | 5): DiscipleshipCourseProgram {
        return (
            EPIC_GENERATIONS_CURRICULUM.find((p) => p.stage === stage) ||
            EPIC_GENERATIONS_CURRICULUM[0]
        );
    },

    /**
     * Get or build student curriculum status for a given church member
     */
    getDiscipleStatus(member: any): DiscipleCurriculumStatus {
        const memberId = Number(member.memberId || 0);
        const memberName = member.fullName || `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Believer";

        // Determine baseline stage from member role
        const ministry = (member.ministry || "").toUpperCase();
        let targetStage: 1 | 2 | 3 | 4 | 5 = 1;
        if (ministry.includes("PASTOR") || ministry.includes("DIRECTOR") || ministry.includes("SENIOR")) {
            targetStage = 5;
        } else if (ministry.includes("LEADER") || ministry.includes("HEAD") || ministry.includes("COORDINATOR")) {
            targetStage = 4;
        } else if (ministry.includes("WORKER") || ministry.includes("CELL") || ministry.includes("TEACHER")) {
            targetStage = 3;
        } else if (ministry.includes("BAPTIZED") || ministry.includes("MEMBER") || ministry.includes("CHOIR")) {
            targetStage = 2;
        } else {
            targetStage = 1;
        }

        // Check shared roster in localStorage
        const storageKey = this.getStorageKey();
        let roster: any[] = [];
        try {
            const raw = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) roster = parsed;
            }
        } catch {}

        const normName = memberName.toLowerCase().trim();
        const idKey = String(memberId);

        // Find active record
        const record = roster.find((r) => {
            const rId = String(r.memberId || r.id || "");
            const rName = String(r.studentName || "").toLowerCase().trim();
            return rId === idKey || rName === normName;
        });

        const program = this.getProgramByStage(targetStage);
        const totalLessons = program.totalLessons; // 18

        let completedLessons = 0;
        let progressPct = 0;
        let gradeScore: number | null = null;
        let mentor = "Pastor Ronnel M. Aviguetero";

        if (record) {
            progressPct = Number(record.progressPercentage || 0);
            completedLessons = Number(record.completedLessons || Math.round((progressPct / 100) * totalLessons));
            gradeScore = record.gradeScore !== undefined ? record.gradeScore : (progressPct >= 100 ? 95 : null);
            mentor = record.instructor || mentor;
        } else {
            // Authentic baseline calculation for San Vicente members
            if (targetStage === 5) {
                completedLessons = 18;
                progressPct = 100;
                gradeScore = 98;
            } else if (targetStage === 4) {
                completedLessons = 12;
                progressPct = 67;
                gradeScore = 90;
            } else if (targetStage === 3) {
                completedLessons = 8;
                progressPct = 44;
            } else if (targetStage === 2) {
                completedLessons = 5;
                progressPct = 28;
            } else {
                completedLessons = 2;
                progressPct = 11;
            }
        }

        const isCertified = progressPct >= 100 || completedLessons >= totalLessons;
        const currentLessonNum = Math.min(totalLessons, completedLessons + 1);

        // Find current lesson title
        let currentLessonTitle = "Lesson 1: Introduction";
        let count = 0;
        for (const mod of program.modules) {
            for (const les of mod.lessons) {
                count++;
                if (count === currentLessonNum) {
                    currentLessonTitle = `${les.title} (${les.scriptureAnchor.split(";")[0]})`;
                    break;
                }
            }
        }

        return {
            memberId,
            memberName,
            stage: targetStage,
            stageName: program.category,
            generationLevel: program.generationLevel,
            currentCourseCode: program.courseCode,
            currentCourseTitle: program.courseTitle,
            currentLessonNumber: currentLessonNum,
            currentLessonTitle,
            completedLessonsCount: completedLessons,
            totalLessonsCount: totalLessons,
            progressPercentage: Math.min(100, Math.round((completedLessons / totalLessons) * 100)),
            gradeScore,
            isCertified,
            mentorName: mentor,
            lastActivityDate: record?.enrolledDate || new Date().toISOString().slice(0, 10),
        };
    },

    /**
     * Advance a disciple's lesson by 1 step in the curriculum
     * Persists immediately to shared LMS storage and syncs across all tabs
     */
    advanceLesson(memberId: number, memberName: string): DiscipleCurriculumStatus {
        const current = this.getDiscipleStatus({ memberId, fullName: memberName });
        const newCompleted = Math.min(current.totalLessonsCount, current.completedLessonsCount + 1);
        const newPct = Math.round((newCompleted / current.totalLessonsCount) * 100);
        const gradeScore = newPct >= 100 ? 95 : (newPct >= 50 ? 90 : null);

        const storageKey = this.getStorageKey();
        let roster: any[] = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) roster = JSON.parse(raw);
        } catch {}

        const normName = memberName.toLowerCase().trim();
        const idKey = String(memberId);

        let found = false;
        for (let i = 0; i < roster.length; i++) {
            const r = roster[i];
            const rId = String(r.memberId || r.id || "");
            const rName = String(r.studentName || "").toLowerCase().trim();
            if (rId === idKey || rName === normName) {
                roster[i] = {
                    ...r,
                    completedLessons: newCompleted,
                    progressPercentage: newPct,
                    gradeScore,
                    completedDate: newPct >= 100 ? new Date().toISOString().slice(0, 10) : null,
                    status: newPct >= 100 ? "Completed" : "In Progress",
                };
                found = true;
                break;
            }
        }

        if (!found) {
            roster.unshift({
                id: `MEM-${memberId}-${Date.now()}`,
                memberId,
                memberCode: `MEM-${memberId}`,
                studentName: memberName,
                courseTitle: current.currentCourseTitle,
                instructor: current.mentorName,
                enrolledDate: new Date().toISOString().slice(0, 10),
                completedDate: newPct >= 100 ? new Date().toISOString().slice(0, 10) : null,
                progressPercentage: newPct,
                completedLessons: newCompleted,
                totalLessons: current.totalLessonsCount,
                status: newPct >= 100 ? "Completed" : "In Progress",
                gradeScore,
            });
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(roster));
        } catch {}

        return this.getDiscipleStatus({ memberId, fullName: memberName });
    },

    /**
     * Update a disciple's progress and grade score directly
     */
    updateDiscipleProgress(
        memberId: number,
        memberName: string,
        completedLessons: number,
        progressPct: number,
        gradeScore: number | null = null
    ): DiscipleCurriculumStatus {
        const current = this.getDiscipleStatus({ memberId, fullName: memberName });
        const storageKey = this.getStorageKey();
        let roster: any[] = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) roster = JSON.parse(raw);
        } catch {}

        const normName = memberName.toLowerCase().trim();
        const idKey = String(memberId);

        let found = false;
        for (let i = 0; i < roster.length; i++) {
            const r = roster[i];
            const rId = String(r.memberId || r.id || "");
            const rName = String(r.studentName || "").toLowerCase().trim();
            if (rId === idKey || rName === normName) {
                roster[i] = {
                    ...r,
                    completedLessons,
                    progressPercentage: progressPct,
                    gradeScore,
                    completedDate: progressPct >= 100 ? new Date().toISOString().slice(0, 10) : null,
                    status: progressPct >= 100 ? "Completed" : "In Progress",
                };
                found = true;
                break;
            }
        }

        if (!found) {
            roster.unshift({
                id: `MEM-${memberId}-${Date.now()}`,
                memberId,
                memberCode: `MEM-${memberId}`,
                studentName: memberName,
                courseTitle: current.currentCourseTitle,
                instructor: current.mentorName,
                enrolledDate: new Date().toISOString().slice(0, 10),
                completedDate: progressPct >= 100 ? new Date().toISOString().slice(0, 10) : null,
                progressPercentage: progressPct,
                completedLessons,
                totalLessons: current.totalLessonsCount,
                status: progressPct >= 100 ? "Completed" : "In Progress",
                gradeScore,
            });
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(roster));
        } catch {}

        return this.getDiscipleStatus({ memberId, fullName: memberName });
    },

    /**
     * Enroll or advance a disciple into a new curriculum stage (1 through 5)
     */
    enrollInStage(memberId: number, memberName: string, stage: 1 | 2 | 3 | 4 | 5, mentor = "Pastor Ronnel M. Aviguetero"): DiscipleCurriculumStatus {
        const program = this.getProgramByStage(stage);
        const storageKey = this.getStorageKey();
        let roster: any[] = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) roster = JSON.parse(raw);
        } catch {}

        const newRecord = {
            id: `MEM-${memberId}-STAGE-${stage}-${Date.now()}`,
            memberId,
            memberCode: `MEM-${memberId}`,
            studentName: memberName,
            courseTitle: program.courseTitle,
            instructor: mentor,
            enrolledDate: new Date().toISOString().slice(0, 10),
            completedDate: null,
            progressPercentage: 0,
            completedLessons: 0,
            totalLessons: program.totalLessons,
            status: "Enrolled",
            gradeScore: null,
        };

        // Remove old enrollment for same course if any, then prepend
        roster = roster.filter((r) => !(String(r.memberId) === String(memberId) && r.courseTitle === program.courseTitle));
        roster.unshift(newRecord);

        try {
            localStorage.setItem(storageKey, JSON.stringify(roster));
        } catch {}

        return this.getDiscipleStatus({ memberId, fullName: memberName, ministry: program.category });
    },

    /**
     * Compute church-wide curriculum monitoring statistics
     */
    getChurchWideMetrics(members: any[]): {
        totalEnrolled: number;
        totalCompleted: number;
        totalLessonsFinished: number;
        stage1Count: number;
        stage2Count: number;
        stage3Count: number;
        stage4Count: number;
        stage5Count: number;
        averageProgressPct: number;
        graduationRatePct: number;
    } {
        const total = members.length || 1;
        let totalCompleted = 0;
        let totalLessonsFinished = 0;
        let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
        let sumProgress = 0;

        for (const m of members) {
            const st = this.getDiscipleStatus(m);
            sumProgress += st.progressPercentage;
            totalLessonsFinished += st.completedLessonsCount;
            if (st.isCertified) totalCompleted++;

            if (st.stage === 1) s1++;
            else if (st.stage === 2) s2++;
            else if (st.stage === 3) s3++;
            else if (st.stage === 4) s4++;
            else if (st.stage === 5) s5++;
        }

        return {
            totalEnrolled: members.length,
            totalCompleted,
            totalLessonsFinished,
            stage1Count: s1,
            stage2Count: s2,
            stage3Count: s3,
            stage4Count: s4,
            stage5Count: s5,
            averageProgressPct: Math.round(sumProgress / total),
            graduationRatePct: Math.round((totalCompleted / total) * 100),
        };
    },

    /**
     * Map course ID or stage number to stage (1-5)
     */
    parseStageFromCourseId(courseId: number): (1 | 2 | 3 | 4 | 5) | null {
        const id = Number(courseId);
        if (id === 1 || id === 101) return 1;
        if (id === 2 || id === 201) return 2;
        if (id === 3 || id === 301) return 3;
        if (id === 4 || id === 401) return 4;
        if (id === 5 || id === 501) return 5;
        return null;
    },

    /**
     * Parse lesson ID into stage and lessonNumber (1 to 18)
     */
    parseLessonId(lessonId: number, courseId?: number): { stage: 1 | 2 | 3 | 4 | 5; lessonNumber: number } | null {
        const id = Number(lessonId);
        if (isNaN(id)) return null;

        // Check format (stage * 10000) + 100 + lessonNumber (e.g. 10101 to 50118)
        if (id >= 10101 && id <= 50118) {
            const stage = Math.floor(id / 10000);
            const lessonNumber = id % 100;
            if (stage >= 1 && stage <= 5 && lessonNumber >= 1 && lessonNumber <= 18) {
                return { stage: stage as 1 | 2 | 3 | 4 | 5, lessonNumber };
            }
        }

        // Check direct lesson number (1 to 18) when courseId is provided
        if (id >= 1 && id <= 18 && courseId) {
            const st = this.parseStageFromCourseId(courseId);
            if (st) return { stage: st, lessonNumber: id };
        }

        return null;
    },

    /**
     * Check if a course ID is one of the 5 generations stage courses
     */
    isGenerationsCourse(courseId: number): boolean {
        return this.parseStageFromCourseId(courseId) !== null;
    },

    /**
     * Check if a lesson ID belongs to the 5 generations stage courses
     */
    isGenerationsLesson(lessonId: number): boolean {
        return this.parseLessonId(lessonId) !== null;
    },

    /**
     * Get completed lesson IDs from localStorage
     */
    getCompletedLessons(): number[] {
        try {
            if (typeof localStorage === "undefined") return [];
            const raw = localStorage.getItem("epic_completed_lessons");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.map(Number);
            }
        } catch {}
        return [];
    },

    /**
     * Check if a specific lesson has been marked completed
     */
    isLessonCompleted(lessonId: number): boolean {
        const list = this.getCompletedLessons();
        return list.includes(Number(lessonId));
    },

    /**
     * Mark a lesson completed and synchronize with disciple progress & Church in Action
     */
    markLessonCompleted(lessonId: number): void {
        const id = Number(lessonId);
        const list = this.getCompletedLessons();
        if (!list.includes(id)) {
            list.push(id);
            try {
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("epic_completed_lessons", JSON.stringify(list));
                }
            } catch {}
        }

        const parsed = this.parseLessonId(id);
        if (parsed) {
            const currentUserName =
                (typeof localStorage !== "undefined" &&
                    (localStorage.getItem("currentFullName") || localStorage.getItem("currentUser"))) ||
                "Believer";
            const memberId = Number(
                (typeof localStorage !== "undefined" && localStorage.getItem("currentMemberId")) || 1
            );

            // Count how many lessons in this stage are completed
            const stageCompleted = list.filter((lId) => {
                const p = this.parseLessonId(lId);
                return p && p.stage === parsed.stage;
            }).length;

            const prog = this.getProgramByStage(parsed.stage);
            const total = prog.totalLessons;
            const pct = Math.min(100, Math.round((stageCompleted / total) * 100));

            this.updateDiscipleProgress(memberId, currentUserName, stageCompleted, pct, pct >= 100 ? 98 : null);

            // Dispatch global event for live reactive updates across tabs and views
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("epic-curriculum-updated", {
                        detail: { lessonId: id, stage: parsed.stage, progress: pct }
                    })
                );
            }
        }
    },

    /**
     * Return all 5 stages as standalone, fully populated LMS courses for Curriculum Studio & Learning catalog
     */
    getGenerationsAsCourses(): any[] {
        const thumbnails: Record<number, string> = {
            1: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=60",
            2: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=60",
            3: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60",
            4: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60",
            5: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60"
        };

        return EPIC_GENERATIONS_CURRICULUM.map((prog) => ({
            courseId: prog.stage * 100 + 1,
            title: `Stage ${prog.stage}: ${prog.courseTitle} (${prog.courseCode})`,
            shortDescription: prog.subtitle,
            description: prog.description,
            thumbnailUrl: thumbnails[prog.stage],
            category: prog.category,
            level: prog.generationTitle,
            estimatedMinutes: 360,
            isPublished: true,
            isFeatured: true,
            instructorName: "Pastor Ronnel M. Aviguetero",
            moduleCount: 6,
            lessonCount: 18,
            createdDate: "2026-11-01"
        }));
    },

    /**
     * Get the full CourseData structure (with all 6 modules and 18 lessons) for ViewCourse.tsx
     */
    getCourseStructure(courseId: number): any | null {
        const stage = this.parseStageFromCourseId(courseId);
        if (!stage) return null;
        const prog = this.getProgramByStage(stage);
        const targetCourseId = stage * 100 + 1;

        const completedList = this.getCompletedLessons();
        let completedCount = 0;

        const modules = prog.modules.map((m) => ({
            courseModuleId: stage * 100 + m.moduleNumber,
            title: `Module ${m.moduleNumber}: ${m.title}`,
            description: m.description,
            sortOrder: m.moduleNumber,
            lessons: m.lessons.map((l) => {
                const lessonId = stage * 10000 + 100 + l.lessonNumber;
                const isCompleted = completedList.includes(lessonId);
                if (isCompleted) completedCount++;

                return {
                    lessonId,
                    title: `Lesson ${l.lessonNumber}: ${l.title}`,
                    content: null,
                    videoUrl: null,
                    resourceUrl: null,
                    sortOrder: l.lessonNumber,
                    estimatedMinutes: 20,
                    isFreePreview: true,
                    moduleId: stage * 100 + m.moduleNumber,
                    moduleSortOrder: m.moduleNumber,
                    progress: {
                        lessonProgressId: 20000 + lessonId,
                        courseEnrollmentId: 1000 + targetCourseId,
                        lessonId,
                        isCompleted,
                        progressPercentage: isCompleted ? 100 : 0,
                        startedDate: isCompleted ? "2026-11-01T08:00:00Z" : null,
                        completedDate: isCompleted ? "2026-11-01T09:00:00Z" : null,
                        timeSpentMinutes: isCompleted ? 20 : 0,
                        lastPositionSeconds: 0
                    }
                };
            })
        }));

        const totalLessons = 18;
        const progressPercentage = Math.round((completedCount / totalLessons) * 100);
        const isCompleted = progressPercentage >= 100 || completedCount >= totalLessons;

        // Determine current lesson
        let currentLessonId: number | null = null;
        for (const mod of modules) {
            for (const les of mod.lessons) {
                if (!les.progress.isCompleted) {
                    currentLessonId = les.lessonId;
                    break;
                }
            }
            if (currentLessonId) break;
        }
        if (!currentLessonId) {
            currentLessonId = stage * 10000 + 101;
        }

        return {
            courseId: targetCourseId,
            courseTitle: `Stage ${stage}: ${prog.courseTitle} (${prog.courseCode})`,
            courseDescription: `${prog.subtitle} — ${prog.description}`,
            courseEnrollmentId: 1000 + targetCourseId,
            progressPercentage,
            isCompleted,
            enrolledDate: "2026-11-01",
            completedDate: isCompleted ? "2026-11-04" : null,
            totalLessons,
            completedLessons: completedCount,
            currentLessonId,
            modules
        };
    },

    /**
     * Get rich lesson content, scripture anchor, exposition, objectives, prayer, and formative quiz for LessonPage.tsx
     */
    getLessonData(lessonId: number, courseId?: number): any | null {
        const parsed = this.parseLessonId(lessonId, courseId);
        if (!parsed) return null;
        const prog = this.getProgramByStage(parsed.stage);
        let targetModule: CurriculumModule | null = null;
        let targetLesson: CurriculumLesson | null = null;

        for (const m of prog.modules) {
            for (const l of m.lessons) {
                if (l.lessonNumber === parsed.lessonNumber) {
                    targetModule = m;
                    targetLesson = l;
                    break;
                }
            }
            if (targetLesson) break;
        }

        if (!targetLesson || !targetModule) return null;

        const actualLessonId = parsed.stage * 10000 + 100 + targetLesson.lessonNumber;
        const targetCourseId = parsed.stage * 100 + 1;
        const completed = this.isLessonCompleted(actualLessonId);

        const objectivesHtml = targetLesson.objectives
            .map((obj) => `<li style="margin-bottom: 6px;"><strong>${obj}</strong></li>`)
            .join("");

        const content = `
<div class="epic-lesson-container" style="font-family: inherit; line-height: 1.7; color: #1e293b;">
    <!-- Course & Stage Banner -->
    <div style="background: ${prog.bannerGradient}; color: white; padding: 24px 28px; border-radius: 14px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                ${prog.icon} ${prog.generationLevel} • Stage ${prog.stage} (${prog.courseCode})
            </span>
            <span style="font-size: 13px; opacity: 0.9;">Module ${targetModule.moduleNumber} of ${prog.modulesCount} • Lesson ${targetLesson.lessonNumber} of ${prog.totalLessons}</span>
        </div>
        <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #ffffff;">${targetLesson.title}</h1>
        <div style="font-size: 15px; opacity: 0.95; font-weight: 500;">
            ${prog.courseTitle} — <em>${targetModule.title}</em>
        </div>
    </div>

    <!-- Scripture Anchor Card -->
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-left: 5px solid #22c55e; border-radius: 10px; padding: 18px 22px; margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; color: #15803d; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
            <span>📖</span> Primary Scripture Anchor
        </div>
        <div style="font-size: 18px; font-weight: 700; color: #166534; font-family: Georgia, serif;">
            ${targetLesson.scriptureAnchor}
        </div>
    </div>

    <!-- Memory Verse Callout Card -->
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; border-radius: 10px; padding: 20px 24px; margin-bottom: 26px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #b45309; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
            <span>⭐</span> Key Memory Verse for Meditation
        </div>
        <blockquote style="margin: 0; font-size: 17px; font-style: italic; line-height: 1.6; color: #78350f; font-family: Georgia, serif;">
            ${targetLesson.memoryVerse}
        </blockquote>
    </div>

    <!-- Learning Objectives -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 26px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <span>🎯</span> Core Learning Objectives
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.8;">
            ${objectivesHtml}
        </ul>
    </div>

    <!-- Theological Exposition & Deep Study -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 26px 28px; margin-bottom: 26px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <span>📜</span> Biblical Exposition & Theological Foundation
        </h2>
        
        <p style="font-size: 16px; line-height: 1.8; color: #334155; margin-bottom: 16px;">
            In this session of <strong>${prog.courseTitle}</strong>, we examine the divine principle revealed in <strong>${targetLesson.scriptureAnchor}</strong>. As disciples progressing along the <em>${prog.generationLevel} (${prog.generationTitle})</em> equipping pathway, understanding this truth is not merely academic, but transformational. God calls every believer to be rooted in His unchanging truth, grounded in grace, and equipped for fruitfulness.
        </p>

        <h3 style="font-size: 17px; font-weight: 700; color: #1e293b; margin: 20px 0 8px;">1. The Doctrinal Principle Revealed in Scripture</h3>
        <p style="font-size: 15px; line-height: 1.8; color: #475569; margin-bottom: 16px;">
            When the Holy Spirit inspired this passage, He established an eternal Kingdom pattern. Our foundation must rest solely on Jesus Christ and His revealed Word. In modern culture, human opinions shift like the wind, but the Word of our God endures forever (Isaiah 40:8). By meditating on <em>${targetLesson.scriptureAnchor}</em>, we discover God's uncompromised heart for our spiritual formation, our ministry calling, and our generational legacy.
        </p>

        <h3 style="font-size: 17px; font-weight: 700; color: #1e293b; margin: 20px 0 8px;">2. Personal Application to Daily Discipleship</h3>
        <p style="font-size: 15px; line-height: 1.8; color: #475569; margin-bottom: 16px;">
            Maturity is measured by our joyful obedience to Christ in everyday decisions. As you reflect on <em>"${targetLesson.title}"</em>, allow the Holy Spirit to search your heart. Where is God asking you to step out in faith? How does this truth reshape your relationships, your family, your workplace, and your local church fellowship at Luke 4:18 Ministries?
        </p>

        <h3 style="font-size: 17px; font-weight: 700; color: #1e293b; margin: 20px 0 8px;">3. The 2 Timothy 2:2 Generational Multiplier</h3>
        <p style="font-size: 15px; line-height: 1.8; color: #475569; margin-bottom: 16px;">
            Paul told Timothy: <em>“And the things that you have heard from me among many witnesses, commit these to faithful men who will be able to teach others also.”</em> Everything you receive in this lesson is not meant to terminate on you. You are being equipped so that tomorrow you can guide and mentor the next generation of believers.
        </p>
    </div>

    <!-- Practical Action Callout -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-left: 5px solid #3b82f6; border-radius: 10px; padding: 22px 24px; margin-bottom: 26px;">
        <h3 style="margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 8px;">
            <span>⚡</span> Practical Step of Obedience (Kingdom Action)
        </h3>
        <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e40af; line-height: 1.6;">
            ${targetLesson.practicalAction}
        </p>
        <div style="font-size: 13px; color: #3b82f6;">
            ✓ Complete this practical action before your next 1-on-1 discipleship check-in with your spiritual mentor.
        </div>
    </div>

    <!-- 1-on-1 Discipleship Questions -->
    <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 26px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #7e22ce; display: flex; align-items: center; gap: 8px;">
            <span>💬</span> 1-on-1 Discipleship Check-In Questions
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #581c87; line-height: 1.8; font-size: 14px;">
            <li>What did the Holy Spirit speak to your heart most clearly through ${targetLesson.scriptureAnchor}?</li>
            <li>In what area of your life does this lesson challenge you to take a bolder step of obedience?</li>
            <li>How can your spiritual mentor or life group pray for you this week as you apply this lesson?</li>
        </ol>
    </div>

    <!-- Pastoral Prayer -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 8px;">
            <span>🙏</span> Pastoral Prayer of Commitment
        </h3>
        <p style="margin: 0; font-size: 15px; font-style: italic; line-height: 1.7; color: #334155; font-family: Georgia, serif;">
            “Heavenly Father, thank You for Your living and active Word. We ask that the truth of ${targetLesson.scriptureAnchor} take deep root in our hearts. Holy Spirit, transform our minds, strengthen our hands for good works, and empower us to be faithful disciples of the Lord Jesus Christ. May our lives bring glory to Your Name and bear fruit that lasts for generations. In Jesus' mighty Name, Amen.”
        </p>
    </div>
</div>
`;

        const quizData = {
            title: `Formative Knowledge Check: ${targetLesson.title}`,
            description: `Verify your biblical understanding of ${targetLesson.title} (${targetLesson.scriptureAnchor}). 70% required to certify completion.`,
            passingScorePercent: 70,
            questions: [
                {
                    id: "q1",
                    question: targetLesson.quizQuestion.question,
                    type: "multiple_choice",
                    options: targetLesson.quizQuestion.options,
                    correctAnswer: targetLesson.quizQuestion.correctAnswer,
                    explanation: targetLesson.quizQuestion.explanation,
                    points: 10
                },
                {
                    id: "q2",
                    question: `Which passage of Scripture serves as the primary theological anchor for this lesson?`,
                    type: "multiple_choice",
                    options: [
                        targetLesson.scriptureAnchor,
                        "1 Chronicles 4:10",
                        "Ecclesiastes 3:1-8",
                        "Leviticus 19:18"
                    ],
                    correctAnswer: 0,
                    explanation: `The foundational scripture for this lesson is ${targetLesson.scriptureAnchor}.`,
                    points: 10
                },
                {
                    id: "q3",
                    question: `What is the assigned practical step of obedience (Kingdom Action) for this lesson?`,
                    type: "multiple_choice",
                    options: [
                        targetLesson.practicalAction,
                        "Postpone personal devotion until free time arises",
                        "Keep faith strictly private without sharing or serving",
                        "Focus only on secular matters"
                    ],
                    correctAnswer: 0,
                    explanation: `Faith without works is dead. The assigned practical action is: ${targetLesson.practicalAction}`,
                    points: 10
                }
            ]
        };

        return {
            lessonId: actualLessonId,
            title: `Lesson ${targetLesson.lessonNumber}: ${targetLesson.title}`,
            content,
            videoUrl: null,
            resourceUrl: null,
            lessonType: "Theological Exposition & Discipleship Study",
            googleClassroomUrl: null,
            googleSheetsUrl: null,
            quizDataJson: JSON.stringify(quizData),
            estimatedMinutes: 20,
            isFreePreview: true,
            progressPercentage: completed ? 100 : 0,
            isCompleted: completed,
            startedDate: "2026-11-01T08:00:00Z",
            completedDate: completed ? "2026-11-01T09:00:00Z" : null,
            courseId: targetCourseId,
            courseModuleId: parsed.stage * 100 + targetModule.moduleNumber,
            moduleTitle: `Module ${targetModule.moduleNumber}: ${targetModule.title}`
        };
    },

    /**
     * Get navigation list of all 18 lessons in a course for LessonPage.tsx
     */
    getNavigationLessons(courseId: number): any[] {
        const stage = this.parseStageFromCourseId(courseId);
        if (!stage) return [];
        const prog = this.getProgramByStage(stage);
        const completedList = this.getCompletedLessons();

        const lessons: any[] = [];
        for (const m of prog.modules) {
            for (const l of m.lessons) {
                const lessonId = stage * 10000 + 100 + l.lessonNumber;
                lessons.push({
                    lessonId,
                    title: `Lesson ${l.lessonNumber}: ${l.title}`,
                    estimatedMinutes: 20,
                    isCompleted: completedList.includes(lessonId)
                });
            }
        }
        return lessons;
    },

    /**
     * Get completion progress for a specific stage (1 to 5)
     */
    getStageProgress(stage: number): {
        stage: number;
        completedCount: number;
        totalLessons: number;
        progressPercentage: number;
        isCompleted: boolean;
    } {
        const s = Number(stage);
        if (s < 1 || s > 5) {
            return { stage: s, completedCount: 0, totalLessons: 18, progressPercentage: 0, isCompleted: false };
        }
        const completedList = this.getCompletedLessons();
        const stageCompleted = completedList.filter((id) => {
            const p = this.parseLessonId(id);
            return p && p.stage === s;
        }).length;

        // Also check if manually flagged completed in localStorage
        const manualComplete =
            typeof localStorage !== "undefined" && localStorage.getItem(`epic_stage_${s}_completed`) === "true";
        const total = 18;
        const pct = manualComplete ? 100 : Math.min(100, Math.round((stageCompleted / total) * 100));
        const isCompleted = manualComplete || stageCompleted >= total || pct >= 100;

        return {
            stage: s,
            completedCount: manualComplete ? total : stageCompleted,
            totalLessons: total,
            progressPercentage: pct,
            isCompleted
        };
    },

    /**
     * Check if a specific stage (1-5) is locked based on prerequisite lower stages.
     * Rule: Learners CANNOT jump to a higher stage without completing the lower stage!
     * Stage 1: Always unlocked.
     * Stage 2: Locked until Stage 1 is 100% completed.
     * Stage 3: Locked until Stage 2 is 100% completed.
     * Stage 4: Locked until Stage 3 is 100% completed.
     * Stage 5: Locked until Stage 4 is 100% completed.
     */
    isStageLocked(stage: number, bypassAdminLock = false): boolean {
        if (bypassAdminLock) return false;
        const s = Number(stage);
        if (s <= 1) return false;
        if (s > 5) return false;

        // Check prerequisite stage (s - 1)
        const prereqProgress = this.getStageProgress(s - 1);
        return !prereqProgress.isCompleted;
    },

    /**
     * Check if a course is locked
     */
    isCourseLocked(courseId: number, bypassAdminLock = false): boolean {
        const stage = this.parseStageFromCourseId(courseId);
        if (!stage) return false;
        return this.isStageLocked(stage, bypassAdminLock);
    },

    /**
     * Get detailed prerequisite and lock information for a stage or course
     */
    getStageLockInfo(courseIdOrStage: number, bypassAdminLock = false): StageLockInfo {
        let stage: (1 | 2 | 3 | 4 | 5) = 1;
        if (courseIdOrStage >= 1 && courseIdOrStage <= 5) {
            stage = courseIdOrStage as 1 | 2 | 3 | 4 | 5;
        } else {
            const parsed = this.parseStageFromCourseId(courseIdOrStage);
            if (parsed) stage = parsed;
        }

        const prog = this.getProgramByStage(stage);
        const courseId = stage * 100 + 1;

        if (stage === 1) {
            return {
                stage: 1,
                courseId,
                courseTitle: prog.courseTitle,
                isLocked: false,
                requiredStage: null,
                requiredStageTitle: null,
                requiredStageCourseId: null,
                requiredStageCompletedCount: 0,
                requiredStageTotalLessons: 18,
                requiredStageProgressPct: 100,
                isPrerequisiteSatisfied: true,
                lockReason: null
            };
        }

        const reqStage = (stage - 1) as 1 | 2 | 3 | 4 | 5;
        const reqProg = this.getProgramByStage(reqStage);
        const reqProgress = this.getStageProgress(reqStage);
        const isLocked = !bypassAdminLock && !reqProgress.isCompleted;

        return {
            stage,
            courseId,
            courseTitle: prog.courseTitle,
            isLocked,
            requiredStage: reqStage,
            requiredStageTitle: reqProg.courseTitle,
            requiredStageCourseId: reqStage * 100 + 1,
            requiredStageCompletedCount: reqProgress.completedCount,
            requiredStageTotalLessons: reqProgress.totalLessons,
            requiredStageProgressPct: reqProgress.progressPercentage,
            isPrerequisiteSatisfied: reqProgress.isCompleted,
            lockReason: isLocked
                ? `Stage ${stage} is locked. Learners must complete 100% of Stage ${reqStage} (${reqProg.generationTitle}) before advancing.`
                : null
        };
    },

    /**
     * Quick helper for testing or pastoral advancement: mark a stage completed or reset progress
     */
    setStageCompleted(stage: number, completed: boolean): void {
        const s = Number(stage);
        if (s < 1 || s > 5) return;
        try {
            if (typeof localStorage !== "undefined") {
                if (completed) {
                    localStorage.setItem(`epic_stage_${s}_completed`, "true");
                    const list = this.getCompletedLessons();
                    for (let l = 1; l <= 18; l++) {
                        const lessonId = s * 10000 + 100 + l;
                        if (!list.includes(lessonId)) list.push(lessonId);
                    }
                    localStorage.setItem("epic_completed_lessons", JSON.stringify(list));
                } else {
                    localStorage.removeItem(`epic_stage_${s}_completed`);
                    const list = this.getCompletedLessons().filter((id) => {
                        const p = this.parseLessonId(id);
                        return !p || p.stage !== s;
                    });
                    localStorage.setItem("epic_completed_lessons", JSON.stringify(list));
                }
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("epic-curriculum-updated", { detail: { stage: s } }));
                }
            }
        } catch {}
    }
};

export default epicGenerationsCurriculumService;
