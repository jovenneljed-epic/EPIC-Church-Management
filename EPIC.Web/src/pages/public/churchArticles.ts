export type ContentBlock =
    | { type: "heading"; level: 2 | 3; text: string }
    | { type: "paragraph"; text: string }
    | { type: "scripture"; verse: string; reference: string; translation?: string }
    | { type: "image"; url: string; caption: string; alt: string }
    | { type: "video"; youtubeId: string; title: string; caption?: string }
    | { type: "callout"; kind: "tip" | "prayer" | "quote" | "reflection"; title?: string; text: string }
    | { type: "list"; style: "bullet" | "numbered"; items: string[] }
    | { type: "download"; title: string; description: string; fileName: string; fileSize: string; fileFormat: string }
    | { type: "button_cta"; label: string; target: string; primary: boolean };

export interface BlogCommentReply {
    id: string;
    authorName: string;
    authorRole: string;
    avatarBg: string;
    timestamp: string;
    content: string;
}

export interface BlogComment {
    id: string;
    articleId: string;
    authorName: string;
    authorRole: string;
    avatarBg: string;
    timestamp: string;
    content: string;
    likes: number;
    replies: BlogCommentReply[];
}

export interface AuthorProfile {
    id: string;
    name: string;
    position: string;
    avatarText: string;
    avatarColor: string;
    bio: string;
    social: {
        facebook?: string;
        email?: string;
    };
}

export interface ChurchArticle {
    id: string;
    title: string;
    slug: string;
    category: "faith-life" | "foundations" | "leadership" | "prayer" | "family" | "youth" | "worship" | "mental-health" | "evangelism" | "discipleship" | "technology" | "church-news";
    categoryLabel: string;
    subtitle: string;
    author: AuthorProfile;
    publishDate: string;
    updatedDate: string;
    readTime: string;
    featuredImage: string;
    featuredImageCaption: string;
    featuredScripture: {
        verse: string;
        reference: string;
    };
    allowComments: boolean;
    seo: {
        metaTitle: string;
        metaDescription: string;
        canonicalUrl: string;
        keywords: string[];
    };
    tags: string[];
    defaultLikes: number;
    blocks: ContentBlock[];
}

export const AUTHORS: Record<string, AuthorProfile> = {
    ronnel: {
        id: "ronnel",
        name: "Pastor Ronnel M. Aviguetero",
        position: "Senior Pastor & Founder, EPIC Church",
        avatarText: "RA",
        avatarColor: "#1877f2",
        bio: "Pastor Ronnel M. Aviguetero has been leading Luke 4:18 Ministries and EPIC Church for over 15 years, passionately equipping believers in grace-filled discipleship, early morning prayer, and church leadership.",
        social: {
            facebook: "https://facebook.com",
            email: "pastor@epicchurch.com"
        }
    },
    council: {
        id: "council",
        name: "EPIC Pastoral Council",
        position: "Leadership & Theological Advisory",
        avatarText: "PC",
        avatarColor: "#1e8e3e",
        bio: "The EPIC Pastoral Council is composed of seasoned pastors, elders, and ministry directors dedicated to biblical fidelity, leadership training, and church health.",
        social: {
            email: "leadership@epicchurch.com"
        }
    },
    familyTeam: {
        id: "familyTeam",
        name: "EPIC Family Life Ministry",
        position: "Marriage & Family Counselors",
        avatarText: "FL",
        avatarColor: "#e37400",
        bio: "Equipping husbands, wives, and parents to establish Christ-centered homes with intentional spiritual habits, marital fidelity, and biblical parenting.",
        social: {
            email: "family@epicchurch.com"
        }
    },
    youthTeam: {
        id: "youthTeam",
        name: "EPIC Youth & Campus Ministry",
        position: "Next-Gen Discipleship Directors",
        avatarText: "YM",
        avatarColor: "#8e24aa",
        bio: "Raising an uncompromised generation of young revivalists, campus ambassadors, and student leaders passionate for holiness and the Great Commission.",
        social: {
            email: "youth@epicchurch.com"
        }
    },
    investigative: {
        id: "investigative",
        name: "EPIC Pastoral Ethics & Investigative Council",
        position: "Church Governance & Parsonage Protection Taskforce",
        avatarText: "TC",
        avatarColor: "#06b6d4",
        bio: "Composed of seasoned elder presbyters, licensed Christian trauma counselors, and ministry audit directors dedicated to parsonage safety, biblical justice, and pastoral transparency.",
        social: {
            email: "ethics@epicchurch.com"
        }
    },
    worshipTeam: {
        id: "worshipTeam",
        name: "EPIC Creative & Worship Arts",
        position: "Worship Directors & Musicians",
        avatarText: "WA",
        avatarColor: "#0077b6",
        bio: "Guiding the congregation into deep, reverent encounters with God's presence through Spirit-led worship, musical excellence, and personal holiness.",
        social: {
            email: "worship@epicchurch.com"
        }
    }
};

export const CHURCH_ARTICLES: ChurchArticle[] = [
    {
        id: "art-death-pastors-wife-documentary",
        title: "When Tragedy Strikes the Parsonage: Reflections on the 'Death of a Pastor's Wife' Documentary, Spiritual Abuse, and Church Accountability",
        slug: "lessons-death-of-a-pastors-wife-documentary-spiritual-abuse-church-accountability",
        category: "church-news",
        categoryLabel: "CHURCH NEWS & INVESTIGATION",
        subtitle: "A biblically grounded investigation into the Mica Miller tragedy, the hidden isolation of ministry wives, coercive control in the name of God, and the non-negotiable mandate for independent elder boards.",
        author: AUTHORS.investigative,
        publishDate: "September 10, 2026",
        updatedDate: "September 10, 2026",
        readTime: "8 min read",
        featuredImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Behind the bright lights of ministry platforms, Christ calls His church to protect the vulnerable and banish coercive abuse from the parsonage.",
        featuredScripture: {
            verse: "“Open your mouth for the mute, for the rights of all who are destitute. Open your mouth, judge righteously, defend the rights of the poor and needy.”",
            reference: "Proverbs 31:8-9"
        },
        allowComments: true,
        seo: {
            metaTitle: "Death of a Pastor's Wife Documentary: Lessons on Spiritual Abuse & Church Accountability",
            metaDescription: "Examining the Mica Miller tragedy, parsonage isolation, coercive control, and how independent elder boards protect church leaders and their families.",
            canonicalUrl: "https://epicchurch.com/blog/lessons-death-of-a-pastors-wife-documentary-spiritual-abuse-church-accountability",
            keywords: ["Death of a Pastors Wife", "Mica Miller", "Spiritual Abuse", "Church Accountability", "Pastoral Care", "Elder Governance"]
        },
        tags: ["ChurchNews", "SpiritualAbuse", "PastoralCare", "ElderGovernance", "ParsonageHealth", "BiblicalJustice"],
        defaultLikes: 342,
        blocks: [
            {
                type: "paragraph",
                text: "The release of the docuseries 'Death of a Pastor\'s Wife' has sent seismic shockwaves through congregations and pastoral networks across the world. Centered on the heartbreaking life and death of 30-year-old Mica Miller—a vibrant worship leader and wife of a prominent church pastor—the series thrusts a spotlight onto reality that many churches prefer to avoid: the silent agony of parsonage isolation, coercive control disguised as spiritual headship, and the catastrophic collapse of church accountability when an authoritarian leader operates unchecked."
            },
            {
                type: "heading",
                level: 2,
                text: "1. The Parsonage as a High-Pressure Glass House"
            },
            {
                type: "paragraph",
                text: "A pastor\'s home is subject to immense, often suffocating expectations. Congregations unconsciously expect the pastor\'s spouse to be an unflinching paragon of grace, host every visiting evangelist, lead ministries without pay, and never reveal marital pain. When domestic mistreatment, psychological intimidation, or mental health crises occur inside the parsonage, a pastor\'s wife often discovers she has nowhere safe to turn. Calling an elder or fellow congregant feels like career suicide for her husband\'s ministry."
            },
            {
                type: "scripture",
                verse: "“Is not this the kind of fasting I have chosen: to loose the chains of injustice and untie the cords of the yoke, to set the oppressed free and break every yoke?”",
                reference: "Isaiah 58:6",
                translation: "NIV"
            },
            {
                type: "heading",
                level: 2,
                text: "2. Differentiating Pastoral Authority from Coercive Control"
            },
            {
                type: "paragraph",
                text: "In abusive ministry environments, scriptures on spiritual submission (Ephesians 5, Hebrews 13) are weaponized. Questioning the senior pastor\'s conduct, financial expenditures, or personal temperament is labeled 'rebellion against God\'s anointed' or 'a spirit of Jezebel.' Coercive control—tracking GPS locations, confiscating bank cards, gaslighting, and isolating a spouse from her family—is not biblical headship; it is spiritual abuse and domestic terror."
            },
            {
                type: "callout",
                kind: "reflection",
                title: "Biblical Definition of Spiritual Abuse",
                text: "Spiritual abuse occurs whenever a spiritual leader uses sacred scripture, religious position, or divine rhetoric to manipulate, intimidate, control, or exploit another person for their own protection and power. Jesus explicitly warned against this in Matthew 20:25-28, forbidding His disciples from lording authority over one another."
            },
            {
                type: "heading",
                level: 2,
                text: "3. The Christian Calling to Justice and Defending the Vulnerable"
            },
            {
                type: "paragraph",
                text: "Scripture does not tell the church to look away from abuse in order to 'protect the reputation of the ministry.' God\'s reputation is protected when righteousness and justice prevail. Below, BibleProject explores the sacred Hebrew concepts of Mishpat and Tzedakah—God\'s eternal standard that true worship requires championing the defenseless."
            },
            {
                type: "video",
                youtubeId: "A14THPoc4-4",
                title: "BibleProject: Justice — God\'s Heart for the Vulnerable and Oppressed",
                caption: "Watch BibleProject\'s biblical breakdown of Justice (Mishpat) and Righteousness (Tzedakah)."
            },
            {
                type: "heading",
                level: 2,
                text: "4. The Non-Negotiable Mandate for Independent Elder Boards"
            },
            {
                type: "paragraph",
                text: "The common denominator in almost every major church tragedy and abuse scandal is the 'Sole Proprietor Model'—a church where the senior pastor handpicks his own board of yes-men, family members, and subordinate staff who have no power to discipline or remove him. The New Testament knows nothing of such a dictatorship. In Acts 14:23, Titus 1:5, and 1 Timothy 5, leadership is always entrusted to a plurality of mature elders who hold independent authority to audit, admonish, and safeguard the flock."
            },
            {
                type: "list",
                style: "bullet",
                items: [
                    "Independent Majority: Over 60% of the church board must be non-staff, non-family members with verified spiritual maturity.",
                    "Whistleblower & Grievance Channels: Dedicated, confidential reporting portals for church staff, ministry wives, and congregants to report abuse safely.",
                    "Independent Third-Party Audits: Mandatory external investigations whenever credible allegations of abuse or coercive control arise.",
                    "Mandatory Parsonage Sabbaticals & Care: Congregations must provide funded, confidential mental health counseling independent of church pastoral staff."
                ]
            },
            {
                type: "download",
                title: "Download Church Board Accountability & Parsonage Protection Protocol",
                description: "Complete legal and biblical template for elder bylaws, independent board voting structures, and parsonage mental health support.",
                fileName: "EPIC-Elder-Governance-Parsonage-Protection-Protocol.pdf",
                fileSize: "3.4 MB",
                fileFormat: "PDF Document"
            },
            {
                type: "paragraph",
                text: "May the tragic death of Mica Miller and the pain exposed in recent documentaries not be in vain. Let it be a catalyst for repentance, biblical reform, and fierce protection of every parsonage and vulnerable soul under our care."
            }
        ]
    },
    {
        id: "art-celebrity-pastor-scandals-accountability",
        title: "Guarding the Sacred Trust: Dismantling the 'Celebrity Pastor' Culture & Restoring Biblical Integrity",
        slug: "guarding-the-sacred-trust-dismantling-celebrity-pastor-culture",
        category: "church-news",
        categoryLabel: "CHURCH NEWS & ETHICS",
        subtitle: "From high-profile resignations to financial opacity: Why the New Testament model of servant elder plurality must replace modern church personality cults.",
        author: AUTHORS.council,
        publishDate: "September 9, 2026",
        updatedDate: "September 9, 2026",
        readTime: "7 min read",
        featuredImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "True biblical greatness is measured by Christlike servanthood, transparent stewardship, and personal holiness.",
        featuredScripture: {
            verse: "“For an overseer, as God's steward, must be above reproach. He must not be arrogant or quick-tempered or a drunkard or violent or greedy for gain...”",
            reference: "Titus 1:7"
        },
        allowComments: true,
        seo: {
            metaTitle: "Dismantling Celebrity Pastor Culture | Church Ethics & Accountability",
            metaDescription: "Examining recent megachurch news, the danger of charisma outpacing character, and restoring biblically transparent church leadership.",
            canonicalUrl: "https://epicchurch.com/blog/guarding-the-sacred-trust-dismantling-celebrity-pastor-culture",
            keywords: ["Church News", "Celebrity Pastor", "Megachurch Scandals", "Church Accountability", "Elder Board"]
        },
        tags: ["ChurchNews", "Leadership", "Accountability", "Ethics", "ElderGovernance"],
        defaultLikes: 215,
        blocks: [
            {
                type: "paragraph",
                text: "In recent months, headline after headline has detailed the tragic fall of prominent megachurch leaders. When gifting outpaces character and charismatic platforms are elevated above humility, disaster is inevitable. The modern church has borrowed too heavily from Hollywood\'s celebrity machinery and corporate America\'s CEO obsession."
            },
            {
                type: "heading",
                level: 2,
                text: "The Danger of Non-Disclosure Agreements (NDAs) in the Church"
            },
            {
                type: "paragraph",
                text: "One of the most alarming revelations in modern church scandals is the rampant use of hush money and Non-Disclosure Agreements (NDAs) to silence victims of abuse or financial malfeasance. The church belongs to Jesus Christ, not a brand. Scripture demands that sin in leadership be dealt with transparently in the light of truth."
            },
            {
                type: "scripture",
                verse: "“Those who sin are to be rebuked publicly, so that the others may take warning.”",
                reference: "1 Timothy 5:20",
                translation: "NIV"
            },
            {
                type: "video",
                youtubeId: "xmFPS0f-kzs",
                title: "BibleProject: The Upside-Down Kingdom of Jesus",
                caption: "Christ demonstrated that true authority is shown through the towel and the cross, never through self-exaltation."
            },
            {
                type: "heading",
                level: 2,
                text: "How EPIC Church Management Enforces Transparent Oversight"
            },
            {
                type: "paragraph",
                text: "Modern church governance cannot rely on blind trust. Cloud systems provide immutable financial ledgers where no individual pastor can move funds without co-signature verification, automated attendance tracking, and transparent member stewardship reporting."
            },
            {
                type: "download",
                title: "Download Church Ethics & Financial Transparency Audit Rubric",
                description: "Comprehensive elder board audit checklist for annual budget reviews, executive compensation limits, and whistleblower protocols.",
                fileName: "EPIC-Church-Financial-Ethics-Rubric.pdf",
                fileSize: "2.1 MB",
                fileFormat: "PDF Document"
            }
        ]
    },
    {
        id: "art-parsonage-burnout-prevention",
        title: "The Silent Parsonage Crisis: 5 Warning Signs of Pastoral Burnout & How Congregations Can Protect Their Leaders",
        slug: "the-silent-parsonage-crisis-warning-signs-pastoral-burnout",
        category: "mental-health",
        categoryLabel: "PASTORAL CARE & HEALING",
        subtitle: "Behind the Sunday smiles: How churches can provide mandatory sabbaticals, confidential counseling, and emotional safety nets for pastors and their families.",
        author: AUTHORS.ronnel,
        publishDate: "September 7, 2026",
        updatedDate: "September 7, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Healing begins when pastors and their spouses are given permission to lay down the cape and rest in Christ.",
        featuredScripture: {
            verse: "“The Lord is near to the brokenhearted and saves the crushed in spirit.”",
            reference: "Psalm 34:18"
        },
        allowComments: true,
        seo: {
            metaTitle: "Pastoral Burnout & Parsonage Crisis: Protection and Care for Church Leaders",
            metaDescription: "Recognizing emotional exhaustion in ministry families, implementing biblical sabbaticals, and building congregational care systems.",
            canonicalUrl: "https://epicchurch.com/blog/the-silent-parsonage-crisis-warning-signs-pastoral-burnout",
            keywords: ["Pastoral Burnout", "Parsonage Crisis", "Pastoral Care", "Mental Health", "Sabbatical"]
        },
        tags: ["MentalHealth", "PastoralCare", "Burnout", "ParsonageSupport", "Rest"],
        defaultLikes: 189,
        blocks: [
            {
                type: "paragraph",
                text: "Studies show that over 40% of pastors contemplate quitting full-time ministry each year, while 70% of pastor\'s wives report feeling isolated and with zero close friends within the church. Pastoral ministry is a spiritual battlefield, and without intentional safeguards, the parsonage quickly becomes a casualty zone."
            },
            {
                type: "heading",
                level: 2,
                text: "1. Emotional Depletion and Chronic Compassion Fatigue"
            },
            {
                type: "paragraph",
                text: "Carrying hospital emergencies, funeral grief, marital crises, and sermons week after week drains emotional reserves. Pastors often feel guilty for resting, assuming that every missed phone call is a failure to shepherd."
            },
            {
                type: "callout",
                kind: "tip",
                title: "Healthy Parsonage Boundaries",
                text: "Congregations should establish clear emergency protocols: lay deacons and coordinators should triage calls during the pastor\'s designated day off, protecting family time as sacred holy ground."
            },
            {
                type: "heading",
                level: 2,
                text: "2. Seeking Professional Christian Counseling is Spiritual Wisdom"
            },
            {
                type: "paragraph",
                text: "Elijah hid under a broom tree and asked God to take his life (1 Kings 19). God did not rebuke him; God sent an angel with food, sleep, and a quiet whisper. Seeking licensed Christian therapy and parsonage counseling is not a lack of faith; it is biblical stewardship of the mind and heart."
            },
            {
                type: "download",
                title: "Download Church Pastor & Spouse Sabbatical Policy Guide",
                description: "Sample sabbatical policy with congregational support guidelines, pulpit supply funding, and restoration timelines.",
                fileName: "EPIC-Pastoral-Sabbatical-Policy-Guide.pdf",
                fileSize: "1.8 MB",
                fileFormat: "PDF Document"
            }
        ]
    },

    {
        id: "art-5-ways-family-faith",
        title: "5 Ways to Strengthen Your Family's Faith at Home",
        slug: "5-ways-to-strengthen-your-family-faith",
        category: "faith-life",
        categoryLabel: "FAITH & LIFE",
        subtitle: "Practical ways Christian families can build stronger spiritual habits together.",
        author: AUTHORS.ronnel,
        publishDate: "September 10, 2026",
        updatedDate: "September 10, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Generational faith begins around the family table and in daily moments of prayer.",
        featuredScripture: {
            verse: "“All things are possible to him who believes.”",
            reference: "Mark 9:23"
        },
        allowComments: true,
        seo: {
            metaTitle: "5 Ways to Strengthen Your Family's Faith at Home | EPIC Church",
            metaDescription: "Practical ways Christian families can build stronger spiritual habits together. Discover family prayer, table Bible study, and serving together.",
            canonicalUrl: "https://epicchurch.com/blog/5-ways-to-strengthen-your-family-faith",
            keywords: ["Family Faith", "Christian Parenting", "Family Devotions", "Prayer at Home", "Pastor Ronnel Aviguetero"]
        },
        tags: ["Faith", "Family", "Discipleship", "Prayer", "ChristianLife"],
        defaultLikes: 142,
        blocks: [
            {
                type: "paragraph",
                text: "In an era of relentless digital distractions, demanding work schedules, and academic pressures, Christian parents often wonder how to pass on a resilient, living faith to their children. Sunday school is a wonderful partner, but scripture makes it crystal clear: the home is God's primary sanctuary for discipleship."
            },
            {
                type: "heading",
                level: 2,
                text: "1. Pray Together Daily (Even for 5 Minutes)"
            },
            {
                type: "paragraph",
                text: "Family prayer does not require a theological dissertation. When children hear Mom and Dad sincerely bring their everyday worries, financial needs, and praises before God at breakfast or before bedtime, prayer transforms from a ritual into a living relationship."
            },
            {
                type: "scripture",
                verse: "“These commandments that I give you today are to be on your hearts. Impress them on your children. Talk about them when you sit at home and when you walk along the road, when you lie down and when you get up.”",
                reference: "Deuteronomy 6:6-7",
                translation: "NIV"
            },
            {
                type: "heading",
                level: 2,
                text: "2. Study God's Word Together Around the Table"
            },
            {
                type: "paragraph",
                text: "The dinner table is the heartbeat of the home. Replacing screens with open Bibles or a simple 10-minute family devotional guide invites children to ask questions, share their school struggles, and discover how God's wisdom speaks directly to their world."
            },
            {
                type: "image",
                url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=80",
                caption: "The dinner table: Where faith is shared, questions are answered, and hearts are knit together in Christ.",
                alt: "Christian family gathered together around table studying Bible"
            },
            {
                type: "heading",
                level: 2,
                text: "3. Serve the Community Together as a Unit"
            },
            {
                type: "paragraph",
                text: "Children learn faith through their hands and feet faster than through lectures. When a family prepares food packages for church outreach, visits an elderly neighbor, or serves on the Sunday usher team together, kids experience the joy of sacrificial Christian love."
            },
            {
                type: "video",
                youtubeId: "xmFPS0f-kzs",
                title: "EPIC Family Discipleship & Marriage Summit Highlights",
                caption: "Watch highlights from our annual Family Faith Summit with Pastor Ronnel Aviguetero."
            },
            {
                type: "heading",
                level: 2,
                text: "4. Establish a Sacred Family Sabbath & Fellowship"
            },
            {
                type: "paragraph",
                text: "Sabbath is not legalism; it is God's gift of rest and delight. Set aside one evening each week where phones are placed in a basket, board games are played, special food is shared, and the family celebrates God's goodness together."
            },
            {
                type: "callout",
                kind: "tip",
                title: "Practical Family Tip for This Week",
                text: "Try the 'High-Low-Praise' dinner game: each person shares their High (best moment), Low (toughest moment), and Praise (how God answered prayer or comforted them)."
            },
            {
                type: "heading",
                level: 2,
                text: "5. Commit to Unbroken Worship in the House of God"
            },
            {
                type: "paragraph",
                text: "Never make Sunday worship an optional extracurricular activity based on soccer games or weekend leisure. When parents treat gathered worship as non-negotiable holy ground, children carry that foundational conviction into adulthood."
            },
            {
                type: "download",
                title: "Download Free Family Faith 30-Day Devotional Guide",
                description: "Printable 30-day family conversation starter sheets with daily scriptures, discussion questions, and bedtime prayer outlines.",
                fileName: "EPIC-30Day-Family-Devotional-Guide.pdf",
                fileSize: "2.4 MB",
                fileFormat: "PDF Document"
            },
            {
                type: "paragraph",
                text: "Building a godly home is not about achieving flawless perfection; it is about keeping Christ at the center of our daily repentance, grace, and joy. Start small today, and watch God bless your family for generations to come."
            }
        ]
    },
    {
        id: "art-tithing-grace",
        title: "Is Tithing Still Relevant Today? Grace, Giving, and God's Economy",
        slug: "is-tithing-still-relevant-today",
        category: "foundations",
        categoryLabel: "BIBLICAL FOUNDATIONS",
        subtitle: "Understanding New Covenant generosity, overcoming financial fear, and honoring God with firstfruits.",
        author: AUTHORS.ronnel,
        publishDate: "September 8, 2026",
        updatedDate: "September 8, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Tithing is an act of trust that God is our ultimate provider and sustainer.",
        featuredScripture: {
            verse: "“Bring the whole tithe into the storehouse, that there may be food in my house...”",
            reference: "Malachi 3:10"
        },
        allowComments: true,
        seo: {
            metaTitle: "Is Tithing Still Relevant Today? | EPIC Church Insights",
            metaDescription: "Explore biblical stewardship, Old Testament tithe vs New Covenant grace giving, and how returning firstfruits honors God.",
            canonicalUrl: "https://epicchurch.com/blog/is-tithing-still-relevant-today",
            keywords: ["Tithing", "Christian Stewardship", "Giving", "Grace Giving"]
        },
        tags: ["Tithing", "Generosity", "Stewardship", "Grace"],
        defaultLikes: 98,
        blocks: [
            {
                type: "paragraph",
                text: "For centuries, believers have wrestled with whether tithing—returning 10% of our increase—is an obsolete Old Testament legal statute or a timeless spiritual discipline. Scripture provides a liberating, grace-filled truth."
            },
            {
                type: "heading",
                level: 2,
                text: "Abraham Tithed 430 Years Before the Law"
            },
            {
                type: "paragraph",
                text: "In Genesis 14, after rescuing Lot, Abraham gave a tenth of everything to Melchizedek, priest of God Most High. There was no written law commanding it; Abraham's tithe was an instinctual act of reverent thanksgiving for God's victory."
            },
            {
                type: "scripture",
                verse: "“Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.”",
                reference: "2 Corinthians 9:7",
                translation: "NIV"
            },
            {
                type: "heading",
                level: 2,
                text: "Breaking the Grip of Financial Fear"
            },
            {
                type: "paragraph",
                text: "When we return our tithes to the local church, we declare that money is not our master. It provides resources for pastoral care, community feeding, and global missionary expansion."
            },
            {
                type: "download",
                title: "Download Church Stewardship & Tithe Ledger Sheet",
                description: "Excel & PDF monthly family budgeting tracker with tithe calculations and emergency reserve planning.",
                fileName: "EPIC-Stewardship-Budget-Ledger.xlsx",
                fileSize: "1.1 MB",
                fileFormat: "Excel Spreadsheet"
            }
        ]
    },
    {
        id: "art-ministry-teams",
        title: "Building Strong Ministry Teams: Moving from Burnout to Delegation",
        slug: "building-strong-ministry-teams",
        category: "leadership",
        categoryLabel: "PASTORAL LEADERSHIP",
        subtitle: "The Jethro principle of tiered leadership, empowering lay coordinators, and creating healthy redundancy.",
        author: AUTHORS.council,
        publishDate: "September 5, 2026",
        updatedDate: "September 5, 2026",
        readTime: "7 min read",
        featuredImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Empowered leaders build an enduring church that weathers every season of growth.",
        featuredScripture: {
            verse: "“What you have heard from me in the presence of many witnesses entrust to faithful people who will be able to teach others also.”",
            reference: "2 Timothy 2:2"
        },
        allowComments: true,
        seo: {
            metaTitle: "Building Strong Ministry Teams | EPIC Church Leadership",
            metaDescription: "Learn how to overcome pastoral burnout through biblical delegation and leadership development.",
            canonicalUrl: "https://epicchurch.com/blog/building-strong-ministry-teams",
            keywords: ["Ministry Leadership", "Pastoral Care", "Delegation", "Volunteer Training"]
        },
        tags: ["Leadership", "Teamwork", "Delegation", "ChurchGrowth"],
        defaultLikes: 84,
        blocks: [
            {
                type: "paragraph",
                text: "The greatest bottleneck in church vitality is when a pastor attempts to carry the weight that God called seventy elders to share. When pastors try to do everything, they burn out and stunt the church's spiritual growth."
            },
            {
                type: "heading",
                level: 2,
                text: "The Counsel of Jethro in Exodus 18"
            },
            {
                type: "paragraph",
                text: "Jethro warned Moses: 'What you are doing is not good. You will surely wear yourself out.' Jethro's strategy was simple: identify capable, God-fearing men of integrity, delegate authority to them, and only handle the most complex disputes."
            },
            {
                type: "callout",
                kind: "quote",
                title: "Ephesians 4:11-12 Equipping Principle",
                text: "Christ gave pastors and teachers not to do all the ministry, but to equip the saints for the work of ministry, for building up the body of Christ."
            }
        ]
    },
    {
        id: "art-early-prayer",
        title: "The Power of 4:00 AM Corporate Prayer: When Ordinary Believers Seek God",
        slug: "power-of-4am-corporate-prayer",
        category: "prayer",
        categoryLabel: "PRAYER & REVIVAL",
        subtitle: "Why historical awakenings started before dawn and how early morning intercession unlocks supernatural breakthrough.",
        author: AUTHORS.ronnel,
        publishDate: "September 1, 2026",
        updatedDate: "September 1, 2026",
        readTime: "5 min read",
        featuredImage: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Before dawn, in the quiet consecrated stillness, heaven hears the cries of the church.",
        featuredScripture: {
            verse: "“Very early in the morning, while it was still dark, Jesus got up, left the house and went off to a solitary place, where he prayed.”",
            reference: "Mark 1:35"
        },
        allowComments: true,
        seo: {
            metaTitle: "The Power of 4:00 AM Corporate Prayer | EPIC Church",
            metaDescription: "Discover why early morning corporate prayer sparks spiritual breakthrough and revives hearts.",
            canonicalUrl: "https://epicchurch.com/blog/power-of-4am-corporate-prayer",
            keywords: ["Corporate Prayer", "Early Morning Prayer", "Revival", "Intercession"]
        },
        tags: ["Prayer", "Revival", "Intercession", "SpiritualDiscipline"],
        defaultLikes: 115,
        blocks: [
            {
                type: "paragraph",
                text: "There is an holy atmosphere when the church gathers before sunrise. In the stillness of 4:00 AM, worldly distractions are silenced, and our spirits are tuned directly to the whisper of the Holy Spirit."
            },
            {
                type: "heading",
                level: 2,
                text: "Jesus Modeled Early Morning Intimacy"
            },
            {
                type: "paragraph",
                text: "Before preaching to the multitudes or casting out demons, Jesus communed with the Father in the early morning darkness. Ministry power is born in secret communion before it is displayed on public platforms."
            }
        ]
    },
    {
        id: "art-reaching-gen-z",
        title: "Why Young People Are Hungry for Real Faith: Reaching Generation Z for Christ",
        slug: "why-young-people-are-hungry-for-real-faith",
        category: "youth",
        categoryLabel: "YOUTH & NEXT GEN",
        subtitle: "Debunking the myth of shallow entertainment; the hunger for holiness, authentic mentors, and radical truth.",
        author: AUTHORS.youthTeam,
        publishDate: "August 25, 2026",
        updatedDate: "August 25, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Gen Z is searching for authentic relationships and uncompromised biblical truth.",
        featuredScripture: {
            verse: "“Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.”",
            reference: "1 Timothy 4:12"
        },
        allowComments: true,
        seo: {
            metaTitle: "Why Young People Are Hungry for Real Faith | EPIC Church",
            metaDescription: "Discover how to disciple Generation Z with biblical authenticity, mentorship, and mission.",
            canonicalUrl: "https://epicchurch.com/blog/why-young-people-are-hungry-for-real-faith",
            keywords: ["Gen Z", "Youth Ministry", "Campus Discipleship", "Next Gen"]
        },
        tags: ["Youth", "GenZ", "Mentorship", "NextGen"],
        defaultLikes: 94,
        blocks: [
            {
                type: "paragraph",
                text: "The myth that youth only want concerts and strobe lights is collapsing. In an age of artificial digital noise and severe anxiety, young people are desperately searching for holiness, authentic community, and uncompromised truth."
            }
        ]
    },
    {
        id: "art-unbroken-worship",
        title: "Beyond Sunday Music: Developing a Lifestyle of Unbroken Worship",
        slug: "beyond-sunday-music-unbroken-worship",
        category: "worship",
        categoryLabel: "WORSHIP & CREATIVE",
        subtitle: "Worship as a 24/7 sacrifice of daily choices, marketplace integrity, and secret prayer.",
        author: AUTHORS.worshipTeam,
        publishDate: "August 20, 2026",
        updatedDate: "August 20, 2026",
        readTime: "5 min read",
        featuredImage: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Worship is the daily offering of our lives upon God's altar.",
        featuredScripture: {
            verse: "“Offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.”",
            reference: "Romans 12:1"
        },
        allowComments: true,
        seo: {
            metaTitle: "Beyond Sunday Music: Unbroken Worship | EPIC Church",
            metaDescription: "Understand worship as a 24/7 posture of heart obedience in the marketplace, home, and secret place.",
            canonicalUrl: "https://epicchurch.com/blog/beyond-sunday-music-unbroken-worship",
            keywords: ["Worship", "Spiritual Life", "Holiness", "Sacrifice"]
        },
        tags: ["Worship", "Holiness", "Surrender", "CreativeArts"],
        defaultLikes: 88,
        blocks: [
            {
                type: "paragraph",
                text: "True worship is tested not when the praise band plays, but when Monday morning begins. When an employee works with excellence for a difficult boss, they are worshiping God."
            }
        ]
    },
    {
        id: "art-mental-health-pastor",
        title: "Anxiety, Depression, and the Grace of God: What Pastors Need to Know",
        slug: "anxiety-depression-and-grace-of-god",
        category: "mental-health",
        categoryLabel: "PASTORAL CARE & HEALING",
        subtitle: "Elijah under the broom tree, removing spiritual stigma, and providing compassionate pastoral intake.",
        author: AUTHORS.council,
        publishDate: "August 15, 2026",
        updatedDate: "August 15, 2026",
        readTime: "9 min read",
        featuredImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "God ministers with tender compassion to those walking through the valley of despair.",
        featuredScripture: {
            verse: "“Cast all your anxiety on him because he cares for you.”",
            reference: "1 Peter 5:7"
        },
        allowComments: true,
        seo: {
            metaTitle: "Anxiety, Depression, and the Grace of God | EPIC Church",
            metaDescription: "A compassionate, biblical approach to mental health, pastoral counseling, and clinical collaboration.",
            canonicalUrl: "https://epicchurch.com/blog/anxiety-depression-and-grace-of-god",
            keywords: ["Mental Health", "Christian Counseling", "Pastoral Care", "Healing"]
        },
        tags: ["MentalHealth", "Counseling", "PastoralCare", "Grace"],
        defaultLikes: 106,
        blocks: [
            {
                type: "paragraph",
                text: "Elijah called down fire on Mount Carmel, yet soon after sat wishing for death under a broom tree. God did not lecture Elijah; an angel fed him and let him rest. Churches must understand both spiritual warfare and human frailty."
            }
        ]
    },
    {
        id: "art-dinner-table-evangelism",
        title: "The Art of Hospitality: How Ordinary Dinners Lead to Extraordinary Salvations",
        slug: "art-of-hospitality-dinner-table-evangelism",
        category: "evangelism",
        categoryLabel: "EVANGELISM & OUTREACH",
        subtitle: "Jesus at the dinner table, breaking down defensive walls, and turning strangers into family.",
        author: AUTHORS.council,
        publishDate: "August 10, 2026",
        updatedDate: "August 10, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "The dining table is one of the most effective evangelistic venues in the world.",
        featuredScripture: {
            verse: "“Share with the Lord's people who are in need. Practice hospitality.”",
            reference: "Romans 12:13"
        },
        allowComments: true,
        seo: {
            metaTitle: "The Art of Hospitality in Evangelism | EPIC Church",
            metaDescription: "Discover how opening your dining room table leads to organic, life-changing salvations.",
            canonicalUrl: "https://epicchurch.com/blog/art-of-hospitality-dinner-table-evangelism",
            keywords: ["Hospitality", "Evangelism", "Cell Groups", "Outreach"]
        },
        tags: ["Hospitality", "Evangelism", "Outreach", "CellGroups"],
        defaultLikes: 79,
        blocks: [
            {
                type: "paragraph",
                text: "Jesus was constantly sharing meals with tax collectors and sinners. A hot meal and a listening ear soften hearts far faster than a theological debate on the street."
            }
        ]
    },
    {
        id: "art-discipleship-stages",
        title: "From Sunday Attendee to Spiritual Reproducer: The 4 Stages of Discipleship",
        slug: "from-sunday-attendee-to-spiritual-reproducer",
        category: "discipleship",
        categoryLabel: "DISCIPLESHIP & MULTIPLICATION",
        subtitle: "Moving from crowd to convert, to servant-worker, to spiritual father and mother.",
        author: AUTHORS.ronnel,
        publishDate: "August 5, 2026",
        updatedDate: "August 5, 2026",
        readTime: "7 min read",
        featuredImage: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Discipleship is an intentional ladder that transforms new converts into spiritual fathers.",
        featuredScripture: {
            verse: "“Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit...”",
            reference: "Matthew 28:19"
        },
        allowComments: true,
        seo: {
            metaTitle: "The 4 Stages of Discipleship | EPIC Church Academy",
            metaDescription: "Learn how believers progress from seekers to spiritual reproducers through structured discipleship.",
            canonicalUrl: "https://epicchurch.com/blog/from-sunday-attendee-to-spiritual-reproducer",
            keywords: ["Discipleship", "EPIC Academy", "Spiritual Growth", "Multiplication"]
        },
        tags: ["Discipleship", "Multiplication", "Mentorship", "Academy"],
        defaultLikes: 122,
        blocks: [
            {
                type: "paragraph",
                text: "Crowds are not the true metric of church health; spiritual reproducers are. Believers must progress systematically through Convert, Disciple, Servant-Leader, and Spiritual Reproducer."
            }
        ]
    },
    {
        id: "art-digital-discipleship",
        title: "Digital Discipleship: Using Technology to Expand the Kingdom Without Losing the Heart",
        slug: "digital-discipleship-technology-ministry",
        category: "technology",
        categoryLabel: "TECHNOLOGY IN MINISTRY",
        subtitle: "How QR attendance, online giving, and digital LMS courses liberate pastors to focus on people and pastoral care.",
        author: AUTHORS.council,
        publishDate: "July 30, 2026",
        updatedDate: "July 30, 2026",
        readTime: "6 min read",
        featuredImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        featuredImageCaption: "Cloud systems eliminate administrative friction and free pastoral staff to care for souls.",
        featuredScripture: {
            verse: "“I have become all things to all people so that by all possible means I might save some.”",
            reference: "1 Corinthians 9:22"
        },
        allowComments: true,
        seo: {
            metaTitle: "Digital Discipleship in the Modern Church | EPIC Church",
            metaDescription: "Explore how cloud software and modern tools enhance church operations and accelerate kingdom impact.",
            canonicalUrl: "https://epicchurch.com/blog/digital-discipleship-technology-ministry",
            keywords: ["Church Technology", "Cloud Management", "Digital Church", "SaaS"]
        },
        tags: ["Technology", "ChurchManagement", "Innovation", "Cloud"],
        defaultLikes: 92,
        blocks: [
            {
                type: "paragraph",
                text: "Technology is the 21st century Roman road. Cloud automation takes care of attendance spreadsheets and financial ledgers so pastors can spend their days in prayer and personal discipleship."
            }
        ]
    }
];

export const INITIAL_COMMENTS: Record<string, BlogComment[]> = {
    "art-death-pastors-wife-documentary": [
        {
            id: "comm-doc-1",
            articleId: "art-death-pastors-wife-documentary",
            authorName: "Sister Deborah Alcantara",
            authorRole: "Pastor's Wife & Women's Counselor",
            avatarBg: "#8b5cf6",
            timestamp: "2 hours ago",
            content: "Thank you, EPIC Church, for having the courage to publish this article! For decades, the suffering of pastors' wives has been swept under the rug in the name of 'protecting the church image.' Watching the documentary on Mica Miller broke my heart into pieces. Every church board must read this and institute independent elder oversight immediately.",
            likes: 48,
            replies: [
                {
                    id: "rep-doc-1",
                    authorName: "Pastor Ronnel M. Aviguetero",
                    authorRole: "Senior Pastor",
                    avatarBg: "#1877f2",
                    timestamp: "1 hour ago",
                    content: "Sister Deborah, Christ demands that we speak for those whose voices have been silenced. God's house must be a fortress of genuine safety and righteous accountability, never a shelter for coercive control. May the Lord bring comfort and deep justice."
                }
            ]
        },
        {
            id: "comm-doc-2",
            articleId: "art-death-pastors-wife-documentary",
            authorName: "Elder Samuel Gutierrez",
            authorRole: "Church Elder & Trustee",
            avatarBg: "#06b6d4",
            timestamp: "4 hours ago",
            content: "Downloaded the Independent Elder Governance Protocol. As an elder board, we are reviewing our bylaws next week to ensure we have mandatory independent audits and zero family nepotism. We must protect our pastoral family and our congregation.",
            likes: 31,
            replies: []
        }
    ],
    "art-5-ways-family-faith": [
        {
            id: "comm-fam-1",
            articleId: "art-5-ways-family-faith",
            authorName: "Sister Michelle Ramos",
            authorRole: "Sunday School Teacher",
            avatarBg: "#1877f2",
            timestamp: "3 hours ago",
            content: "This is so timely! We started doing the 'High-Low-Praise' dinner conversation with our two kids last week and the vulnerability and prayer that came out of it was so beautiful. Thank you Pastor Ronnel for always pointing our homes back to Christ!",
            likes: 19,
            replies: [
                {
                    id: "rep-fam-1",
                    authorName: "Pastor Ronnel M. Aviguetero",
                    authorRole: "Senior Pastor",
                    avatarBg: "#1e8e3e",
                    timestamp: "2 hours ago",
                    content: "Praise the Lord Sister Michelle! When parents model vulnerability at the table, children grow up knowing God is near. Keep tending that family altar!"
                }
            ]
        },
        {
            id: "comm-fam-2",
            articleId: "art-5-ways-family-faith",
            authorName: "Brother Gerald Santos",
            authorRole: "Cell Group Leader",
            avatarBg: "#e37400",
            timestamp: "5 hours ago",
            content: "Downloaded the 30-Day Family Devotional PDF! The discussion prompts are straightforward and easy for our teenagers to understand. Sharing this with all our cell group parents.",
            likes: 12,
            replies: []
        }
    ],
    "art-tithing-grace": [
        {
            id: "comm-t1",
            articleId: "art-tithing-grace",
            authorName: "Sister Grace Villanueva",
            authorRole: "Ministry Leader",
            avatarBg: "#1877f2",
            timestamp: "1 day ago",
            content: "This article brought so much clarity! Seeing Abraham honor Melchizedek out of pure gratitude shifted my perspective entirely from legal obligation to kingdom worship.",
            likes: 24,
            replies: []
        }
    ]
};
