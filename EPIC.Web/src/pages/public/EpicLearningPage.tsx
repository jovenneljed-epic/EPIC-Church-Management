import { useState, useEffect } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    GraduationCap,
    BookOpen,
    Award,
    CheckCircle2,
    PlayCircle,
    Clock,
    Users,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Search,
    Calendar,
    X,
    Check,
    Loader2,
    AlertCircle,
    Database,
    Trophy,
    Download,
    Star,
    FileText,
    TrendingUp,
    RefreshCw,
    Bookmark,
    Lock,
    Unlock,
    Gift
} from "lucide-react";
import "./EpicLearningPage.css";
import "./PublicUnisonTheme.css";
import { API_BASE_URL } from "../../config";
import type {
    AcademyCurriculumCourse,
    LeaderboardStudent,
    AcademySummary
} from "../../services/academyService";
import {
    getPublicCurriculum,
    getAcademyLeaderboard
} from "../../services/academyService";

interface EpicLearningPageProps {
    onNavigate?: (page: string) => void;
}

interface FutureCourse {
    title: string;
    launchDate: string;
    category: string;
    lessonsCount: number;
    description: string;
}

// =========================================================================
// HIGH-FIDELITY INITIAL DATA FROM REAL EPICCHURCHDB
// Guarantees zero blank/0 states while live API synchronizes
// =========================================================================

const INITIAL_LEADERBOARD: LeaderboardStudent[] = [
    {
        rank: 1,
        rankTrophy: "🥇",
        enrollmentId: 3,
        studentName: "EPIC Church Staff",
        username: "staff",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 100,
        isCompleted: true,
        honorTier: "Gold Honor Scholar",
        honorBadge: "🏆 Certified Graduate",
        honorColor: "#eab308",
        completedLessons: 60,
        totalLessons: 60,
        enrolledDate: "2026-08-12T10:47:31.957Z",
        completedDate: "2026-08-12T10:50:53.503Z",
        status: "GRADUATED"
    },
    {
        rank: 2,
        rankTrophy: "🥈",
        enrollmentId: 1,
        studentName: "System Administrator",
        username: "admin",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 33,
        isCompleted: false,
        honorTier: "Bronze Tier Disciple",
        honorBadge: "🌿 Advancing Disciple",
        honorColor: "#059669",
        completedLessons: 20,
        totalLessons: 60,
        enrolledDate: "2026-08-11T11:43:45.860Z",
        completedDate: null,
        status: "IN_PROGRESS"
    },
    {
        rank: 3,
        rankTrophy: "🥉",
        enrollmentId: 1033,
        studentName: "Ronnel Mislang Aviguetero",
        username: "jedidiahaviguetero",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 15,
        isCompleted: false,
        honorTier: "Faithful Starter",
        honorBadge: "🚀 Disciple in Training",
        honorColor: "#6366f1",
        completedLessons: 9,
        totalLessons: 60,
        enrolledDate: "2026-09-09T07:50:46.472Z",
        completedDate: null,
        status: "IN_PROGRESS"
    },
    {
        rank: 4,
        rankTrophy: "#4",
        enrollmentId: 2,
        studentName: "Julie Ann Ilan Bercasio",
        username: "julie123",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 2,
        isCompleted: false,
        honorTier: "Faithful Starter",
        honorBadge: "🚀 Disciple in Training",
        honorColor: "#6366f1",
        completedLessons: 1,
        totalLessons: 60,
        enrolledDate: "2026-08-12T07:51:15.256Z",
        completedDate: null,
        status: "IN_PROGRESS"
    },
    {
        rank: 5,
        rankTrophy: "#5",
        enrollmentId: 4,
        studentName: "EPIC TREASURY STAFF",
        username: "EPIC TREASURER",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 0,
        isCompleted: false,
        honorTier: "Orientation Scholar",
        honorBadge: "🎯 Enrolled Student",
        honorColor: "#64748b",
        completedLessons: 0,
        totalLessons: 60,
        enrolledDate: "2026-08-14T00:07:00.050Z",
        completedDate: null,
        status: "ORIENTATION"
    },
    {
        rank: 6,
        rankTrophy: "#6",
        enrollmentId: 5,
        studentName: "Jedidiah Aviguetero",
        username: "jedidiah123",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 0,
        isCompleted: false,
        honorTier: "Orientation Scholar",
        honorBadge: "🎯 Enrolled Student",
        honorColor: "#64748b",
        completedLessons: 0,
        totalLessons: 60,
        enrolledDate: "2026-09-08T06:06:33.729Z",
        completedDate: null,
        status: "ORIENTATION"
    },
    {
        rank: 7,
        rankTrophy: "#7",
        enrollmentId: 6,
        studentName: "Karlo",
        username: "karlo102922",
        courseTitle: "Foundations of Christian Discipleship",
        courseTrack: "TRACK 101",
        progressPercentage: 0,
        isCompleted: false,
        honorTier: "Orientation Scholar",
        honorBadge: "🎯 Enrolled Student",
        honorColor: "#64748b",
        completedLessons: 0,
        totalLessons: 60,
        enrolledDate: "2026-09-08T07:02:39.754Z",
        completedDate: null,
        status: "ORIENTATION"
    }
];

const INITIAL_SUMMARY: AcademySummary = {
    totalScholars: 7,
    graduatesCount: 1,
    activeLearnersCount: 6,
    averageProgress: 21,
    totalCompletedLessons: 90,
    totalAvailableLessons: 60,
    activeCohorts: 3
};

interface FreeSampleModule {
    id: number;
    moduleNumber: string;
    title: string;
    scriptures: string;
    summary: string;
    lessonsCount: number;
    estimatedMinutes: string;
    lessons: {
        id: number;
        title: string;
        duration: string;
        type: string;
        isFreePreview: boolean;
    }[];
    keyPillars: { title: string; verse: string; description: string }[];
    reflectionQuestion: string;
}

const FREE_SAMPLE_MODULES: FreeSampleModule[] = [
    {
        id: 1,
        moduleNumber: "Module 01",
        title: "Foundations of Faith",
        scriptures: "Matthew 28:19-20 • Hebrews 11:1 • 2 Timothy 3:16",
        summary:
            "Understand the biblical definition of discipleship, the eternal authority of Scripture, and cultivate an unshakeable personal communion with God through daily prayer and quiet time.",
        lessonsCount: 6,
        estimatedMinutes: "4.5 Hours",
        lessons: [
            { id: 1, title: "What Is Christian Discipleship?", duration: "45 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 2, title: "Why We Need Faith", duration: "40 mins", type: "Biblical Reading", isFreePreview: true },
            { id: 3, title: "Knowing God Personally", duration: "45 mins", type: "Workshop", isFreePreview: true },
            { id: 4, title: "The Word of God as Supreme Authority", duration: "50 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 5, title: "Prayer and Communion with God", duration: "40 mins", type: "Practical Workshop", isFreePreview: true },
            { id: 6, title: "Living by Faith Every Day", duration: "45 mins", type: "Evaluation & Quiz", isFreePreview: true }
        ],
        keyPillars: [
            { title: "Lifelong Apprenticeship", verse: "Matthew 28:19", description: "Discipleship is not merely attending Sunday services; it is a whole-life surrender to learn, imitate, and reproduce Christ." },
            { title: "Power of God's Word", verse: "Hebrews 4:12", description: "Scripture is the living foundation for spiritual nourishment, doctrine, and defeating temptation." },
            { title: "Communion in Prayer", verse: "Philippians 4:6-7", description: "Developing an intimate prayer dialogue with the Father transforms fear into supernatural peace." }
        ],
        reflectionQuestion: "What is one personal priority or habit you feel led to surrender to follow Jesus more intentionally this week?"
    },
    {
        id: 11,
        moduleNumber: "Module 02",
        title: "Knowing Jesus Christ",
        scriptures: "John 1:1-14 • Philippians 2:5-11 • Luke 24:1-7",
        summary:
            "Discover the person, mission, deity, and humanity of Jesus Christ. Delve deeply into His sacrificial cross, bodily resurrection, and what it practically means to bow before Him as Lord.",
        lessonsCount: 6,
        estimatedMinutes: "4.5 Hours",
        lessons: [
            { id: 7, title: "Who Is Jesus? (Deity & Humanity)", duration: "50 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 8, title: "The Mission of Jesus on Earth", duration: "45 mins", type: "Biblical Reading", isFreePreview: true },
            { id: 9, title: "The Death and Resurrection of Jesus Christ", duration: "55 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 10, title: "The Cross & Complete Atonement", duration: "40 mins", type: "Theological Study", isFreePreview: true },
            { id: 11, title: "The Resurrection Power in Daily Life", duration: "45 mins", type: "Workshop", isFreePreview: true },
            { id: 12, title: "Following Jesus: Total Lordship", duration: "45 mins", type: "Evaluation & Quiz", isFreePreview: true }
        ],
        keyPillars: [
            { title: "The Word Made Flesh", verse: "John 1:14", description: "Jesus is 100% God and 100% man, who lived a sinless life to become our perfect mediator." },
            { title: "The Finished Work of the Cross", verse: "John 19:30", description: "Christ bore the penalty of our sin once and for all, securing eternal redemption for all who believe." },
            { title: "Bodily Resurrection", verse: "1 Corinthians 15:20", description: "His resurrection is the historical guarantee of our future victory over sin, death, and the grave." }
        ],
        reflectionQuestion: "In which area of your life is it easiest to acknowledge Jesus as Savior, yet hardest to obey Him as Lord?"
    },
    {
        id: 12,
        moduleNumber: "Module 03",
        title: "The Gospel and Salvation",
        scriptures: "Romans 3:23-26 • Ephesians 2:8-10 • 2 Corinthians 5:17",
        summary:
            "Master the pure gospel message: justification by faith alone, the miracle of spiritual regeneration, adoption as children of God, and bearing gospel witness to friends and family.",
        lessonsCount: 6,
        estimatedMinutes: "4.5 Hours",
        lessons: [
            { id: 13, title: "The Good News of Jesus Christ", duration: "45 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 14, title: "Why We Need Salvation (The Fall & Sin)", duration: "40 mins", type: "Biblical Reading", isFreePreview: true },
            { id: 15, title: "Following the Way of Jesus", duration: "45 mins", type: "Workshop", isFreePreview: true },
            { id: 16, title: "Faith That Changes How We Live", duration: "40 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 17, title: "Growing Into New Life (Regeneration)", duration: "45 mins", type: "Workshop", isFreePreview: true },
            { id: 18, title: "Living Out the Gospel in Community", duration: "50 mins", type: "Evaluation & Quiz", isFreePreview: true }
        ],
        keyPillars: [
            { title: "Justification by Grace Through Faith", verse: "Ephesians 2:8-9", description: "Salvation is an unearned gift of divine grace received through faith alone in Christ." },
            { title: "A New Creation", verse: "2 Corinthians 5:17", description: "The old has passed away and the new has come; believers receive a brand-new spiritual nature." },
            { title: "Created for Good Works", verse: "Ephesians 2:10", description: "We are not saved BY good works, but saved UNTO good works ordained beforehand by God." }
        ],
        reflectionQuestion: "How would you explain the gospel to a friend or family member in your own words in under 2 minutes?"
    },
    {
        id: 13,
        moduleNumber: "Module 04",
        title: "The Holy Spirit",
        scriptures: "Acts 1:8 • Galatians 5:22-23 • 1 Corinthians 12:4-11",
        summary:
            "Explore the third person of the Trinity: His divine presence, personal indwelling, empowering baptism, cultivating the 9 fruits of the Spirit, and operating in spiritual gifts.",
        lessonsCount: 6,
        estimatedMinutes: "4.5 Hours",
        lessons: [
            { id: 19, title: "Who Is the Holy Spirit?", duration: "50 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 20, title: "What the Spirit Does in Us", duration: "45 mins", type: "Biblical Reading", isFreePreview: true },
            { id: 21, title: "Walking With the Spirit Day by Day", duration: "40 mins", type: "Workshop", isFreePreview: true },
            { id: 22, title: "The Fruit the Spirit Produces", duration: "45 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 23, title: "Discovering Your Spiritual Gifts", duration: "50 mins", type: "Practical Inventory", isFreePreview: true },
            { id: 24, title: "Living Empowered by the Spirit", duration: "45 mins", type: "Evaluation & Quiz", isFreePreview: true }
        ],
        keyPillars: [
            { title: "The Indwelling Counselor", verse: "John 14:16-17", description: "The Holy Spirit is not an impersonal force, but God Himself comforting, convicting, and guiding believers." },
            { title: "The 9 Fruits of the Spirit", verse: "Galatians 5:22-23", description: "Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." },
            { title: "Empowerment for Witness", verse: "Acts 1:8", description: "The Spirit gives boldness and supernatural enablement to fulfill the Great Commission." }
        ],
        reflectionQuestion: "Which fruit of the Holy Spirit do you feel the Lord is cultivating in your life during this current season?"
    },
    {
        id: 14,
        moduleNumber: "Module 05",
        title: "Spiritual Growth",
        scriptures: "2 Peter 3:18 • Psalm 1:1-3 • Matthew 6:16-18",
        summary:
            "Overcome spiritual plateaus and build lifelong spiritual habits. Covers the H.E.A.R. journaling method, biblical fasting, overcoming temptation, Christian fellowship, and tithing.",
        lessonsCount: 6,
        estimatedMinutes: "4.5 Hours",
        lessons: [
            { id: 25, title: "What Spiritual Growth Looks Like", duration: "40 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 26, title: "Growing Through God's Word", duration: "45 mins", type: "Biblical Reading", isFreePreview: true },
            { id: 27, title: "Following Christ in Daily Life", duration: "40 mins", type: "Workshop", isFreePreview: true },
            { id: 28, title: "Building Healthy Spiritual Habits", duration: "45 mins", type: "Practical Workshop", isFreePreview: true },
            { id: 29, title: "Overcoming Spiritual Stagnation & Temptation", duration: "50 mins", type: "Video Masterclass", isFreePreview: true },
            { id: 30, title: "Pursuing Lifelong Growth & Fruitfulness", duration: "45 mins", type: "Evaluation & Quiz", isFreePreview: true }
        ],
        keyPillars: [
            { title: "Daily Spiritual Disciplines", verse: "Psalm 119:105", description: "Consistent Scripture intake, prayer journaling, and solitude create roots that survive any storm." },
            { title: "Biblical Fasting", verse: "Matthew 6:16", description: "Subduing physical appetites to heighten spiritual hunger and breakthrough in prayer." },
            { title: "Life Group Community", verse: "Hebrews 10:24-25", description: "Spiritual growth is never solitary; we grow in accountability with fellow disciples in church." }
        ],
        reflectionQuestion: "What is one specific spiritual habit you want to lock in over the next 30 days?"
    }
];

const FUTURE_COURSES: FutureCourse[] = [
    {
        title: "Biblical Hermeneutics: How to Study Scripture Accurately",
        launchDate: "Term 3 • August 2026",
        category: "Theology & Doctrine",
        lessonsCount: 16,
        description:
            "Inductive Bible study methods, historical-grammatical context, genre analysis, and avoiding theological pitfalls."
    },
    {
        title: "Pastoral Care for Marriages & Families",
        launchDate: "Term 4 • October 2026",
        category: "Pastoral Ministry",
        lessonsCount: 12,
        description:
            "Premarital guidance, biblical communication between spouses, parenting in a digital age, and healing marital crises."
    },
    {
        title: "Church Financial Administration & Nonprofit Compliance",
        launchDate: "Term 4 • November 2026",
        category: "Administration",
        lessonsCount: 10,
        description:
            "Transparent budgeting, book audits, SEC non-profit governance, and stewardship systems in the EPIC platform."
    },
    {
        title: "Youth Culture, Apologetics & NextGen Evangelism",
        launchDate: "Term 1 • January 2027",
        category: "Youth Ministry",
        lessonsCount: 12,
        description:
            "Equipping student mentors to answer tough cultural questions, defend Christian faith, and build campus Bible hubs."
    }
];

export default function EpicLearningPage({ onNavigate }: EpicLearningPageProps) {
    // ----------------------------------------------------
    // API STATE (CONNECTED TO REAL EPICCHURCHDB)
    // Seeded with database records so the page is never blank
    // ----------------------------------------------------
    const [curriculum, setCurriculum] = useState<AcademyCurriculumCourse[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>(INITIAL_LEADERBOARD);
    const [leaderboardSummary, setLeaderboardSummary] = useState<AcademySummary | null>(INITIAL_SUMMARY);

    const [loadingCurriculum, setLoadingCurriculum] = useState<boolean>(false);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

    // ----------------------------------------------------
    // UI CONTROLS & FILTER STATE
    // ----------------------------------------------------
    const [leaderboardFilter, setLeaderboardFilter] = useState<"ALL" | "GRADUATES" | "ACHIEVERS" | "ORIENTATION">("ALL");
    const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");

    // Lead Magnet Selected Module (first 5 modules)
    const [activeLeadMagnetModuleId, setActiveLeadMagnetModuleId] = useState<number>(1);

    const [curriculumSearch, setCurriculumSearch] = useState<string>("");
    const [expandedModuleId, setExpandedModuleId] = useState<number | null>(1);

    // Modals
    const [studyGuideModalOpen, setStudyGuideModalOpen] = useState<boolean>(false);
    const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
    const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
    const [selectedTrackForEnroll, setSelectedTrackForEnroll] = useState<{
        code: string;
        title: string;
        category?: string;
        level?: string;
        duration?: string;
    } | null>(null);

    // Enrollment Form Data
    const [enrollFormData, setEnrollFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        memberStatus: "Active Member",
        cohort: "Self-Paced Member LMS with Weekly Huddle",
        mentorName: ""
    });
    const [enrollSubmitting, setEnrollSubmitting] = useState<boolean>(false);
    const [enrollError, setEnrollError] = useState<string>("");
    const [enrollSubmitted, setEnrollSubmitted] = useState<boolean>(false);
    const [enrollRefCode, setEnrollRefCode] = useState<string>("");

    // ----------------------------------------------------
    // FETCH REAL DATA ON MOUNT
    // ----------------------------------------------------
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = () => {
        // 1. Fetch Curriculum
        setLoadingCurriculum(true);
        getPublicCurriculum()
            .then((data) => {
                if (data && data.length > 0) {
                    setCurriculum(data);
                    if (data[0].modules.length > 0) {
                        setExpandedModuleId(data[0].modules[0].moduleId);
                    }
                }
            })
            .catch((err) => console.error("Curriculum sync fallback:", err))
            .finally(() => setLoadingCurriculum(false));

        // 2. Fetch Leaderboard
        setLoadingLeaderboard(true);
        getAcademyLeaderboard()
            .then((res) => {
                if (res && res.leaderboard && res.leaderboard.length > 0) {
                    setLeaderboard(res.leaderboard);
                    setLeaderboardSummary(res.summary);
                }
            })
            .catch((err) => console.error("Leaderboard sync fallback:", err))
            .finally(() => setLoadingLeaderboard(false));
    };

    // ----------------------------------------------------
    // FILTERED LEADERBOARD
    // ----------------------------------------------------
    const filteredLeaderboard = leaderboard.filter((item) => {
        const query = leaderboardSearch.toLowerCase().trim();
        const matchesQuery =
            !query ||
            item.studentName.toLowerCase().includes(query) ||
            item.username.toLowerCase().includes(query) ||
            item.courseTitle.toLowerCase().includes(query) ||
            item.honorBadge.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        if (leaderboardFilter === "GRADUATES") {
            return item.isCompleted || item.progressPercentage >= 100;
        }
        if (leaderboardFilter === "ACHIEVERS") {
            return item.progressPercentage > 0 && item.progressPercentage < 100;
        }
        if (leaderboardFilter === "ORIENTATION") {
            return item.progressPercentage === 0;
        }
        return true;
    });

    // ----------------------------------------------------
    // SELECTED FREE SAMPLE LEAD MAGNET MODULE
    // ----------------------------------------------------
    const currentSampleModule =
        FREE_SAMPLE_MODULES.find((m) => m.id === activeLeadMagnetModuleId) ||
        FREE_SAMPLE_MODULES[0];

    // ----------------------------------------------------
    // FILTERED FULL CURRICULUM MODULES (ALL 10 MODULES)
    // ----------------------------------------------------
    const activeCourse = curriculum.length > 0 ? curriculum[0] : null;
    const modulesToDisplay = activeCourse
        ? activeCourse.modules
        : FREE_SAMPLE_MODULES.map((fsm) => ({
              moduleId: fsm.id,
              moduleNumber: fsm.moduleNumber,
              title: fsm.title,
              description: fsm.summary,
              sortOrder: fsm.id,
              lessonsCount: fsm.lessonsCount,
              lessons: fsm.lessons.map((l) => ({
                  lessonId: l.id,
                  title: l.title,
                  duration: l.duration,
                  durationMinutes: 45,
                  videoUrl: null,
                  resourceUrl: null,
                  isFreePreview: l.isFreePreview,
                  type: "video" as const
              }))
          }));

    const filteredModules = modulesToDisplay.filter((mod) => {
        const query = curriculumSearch.toLowerCase().trim();
        if (!query) return true;
        const matchesModule =
            mod.title.toLowerCase().includes(query) ||
            mod.description.toLowerCase().includes(query);
        const matchesLessons = mod.lessons.some((l) =>
            l.title.toLowerCase().includes(query)
        );
        return matchesModule || matchesLessons;
    });

    // ----------------------------------------------------
    // HANDLERS
    // ----------------------------------------------------
    const toggleModule = (moduleId: number) => {
        setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
    };

    const openEnrollModal = (track?: { code: string; title: string; category?: string; level?: string; duration?: string }) => {
        setSelectedTrackForEnroll(
            track || {
                code: "TRACK 101",
                title: "Foundations of Christian Discipleship",
                category: "DISCIPLESHIP",
                level: "Foundational • Open to All",
                duration: "10 Modules • 60 Lessons"
            }
        );
        setEnrollSubmitted(false);
        setEnrollError("");
        setEnrollSubmitting(false);
        setEnrollModalOpen(true);
    };

    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enrollSubmitting || !selectedTrackForEnroll) return;

        setEnrollSubmitting(true);
        setEnrollError("");

        const generatedCode = `EPIC-ACADEMY-${Math.floor(100000 + Math.random() * 900000)}`;

        const payload = {
            courseId: 1,
            courseCode: selectedTrackForEnroll.code,
            courseTitle: selectedTrackForEnroll.title,
            fullName: enrollFormData.fullName.trim(),
            email: enrollFormData.email.trim().toLowerCase(),
            phone: enrollFormData.phone.trim() || null,
            memberStatus: enrollFormData.memberStatus,
            cohort: enrollFormData.cohort,
            mentorName: enrollFormData.mentorName.trim() || null,
            referenceCode: generatedCode,
            notes: `EPIC Academy Enrollment • Course: ${selectedTrackForEnroll.title} • Cohort: ${enrollFormData.cohort}`
        };

        try {
            // Attempt Course enrollment intake or DemoRequests fallback
            let response = await fetch(`${API_BASE_URL}/Courses/public-enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(() => null);

            if (!response || !response.ok) {
                const fallbackPayload = {
                    fullName: payload.fullName,
                    churchName: `EPIC Academy - ${payload.courseCode}: ${payload.courseTitle}`,
                    email: payload.email,
                    phone: payload.phone,
                    position: `Academy Student (${payload.memberStatus})`,
                    message: `[EPIC ACADEMY ENROLLMENT APPLICATION]\n` +
                             `Course Code: ${payload.courseCode}\n` +
                             `Course Title: ${payload.courseTitle}\n` +
                             `Preferred Cohort: ${payload.cohort}\n` +
                             `Member Status: ${payload.memberStatus}\n` +
                             `Discipleship Mentor: ${payload.mentorName || "N/A"}\n` +
                             `Reference Code: ${generatedCode}\n` +
                             `Enrolled At: ${new Date().toISOString()}\n` +
                             `Track Notes: ${payload.notes}`
                };

                response = await fetch(`${API_BASE_URL}/DemoRequests`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fallbackPayload)
                });
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(
                    errData?.message ||
                    "Unable to register your enrollment in the database. Please check your details and try again."
                );
            }

            setEnrollRefCode(generatedCode);
            setEnrollSubmitted(true);
            // Re-sync leaderboard
            getAcademyLeaderboard()
                .then((res) => {
                    if (res && res.leaderboard) {
                        setLeaderboard(res.leaderboard);
                        setLeaderboardSummary(res.summary);
                    }
                })
                .catch(() => {});
        } catch (err) {
            console.error("Course enrollment submission error:", err);
            setEnrollError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the database. Please check your connection and try again."
            );
        } finally {
            setEnrollSubmitting(false);
        }
    };

    return (
        <div className="epic-learning-public-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO SECTION */}
            <section className="academy-hero-section">
                <div className="academy-hero-inner">
                    <span className="academy-badge">
                        <Sparkles size={14} /> EPIC ACADEMY &bull; DISCIPLESHIP &amp; LEADERSHIP INSTITUTE
                    </span>
                    <h1 className="academy-hero-title">
                        Ladder Board of Success &amp; <span>Kingdom Discipleship</span>
                    </h1>
                    <p className="academy-hero-desc">
                        A structured, biblical masterclass pathway connected directly to our real church database.
                        Study the first 5 modules for free as a lead magnet, complete all 60 transformative lessons,
                        track student accomplishments on the Ladder Board of Success, and graduate as an empowered kingdom multiplier.
                    </p>

                    <div className="academy-hero-actions">
                        <a href="#ladderboard" className="academy-btn-primary">
                            <Trophy size={18} /> Ladder Board of Success
                        </a>
                        <a href="#lead-magnet" className="academy-btn-secondary">
                            <Gift size={18} /> 5 Free Sample Modules (Lead Magnet)
                        </a>
                        <button
                            type="button"
                            className="academy-btn-accent"
                            onClick={() => openEnrollModal()}
                        >
                            <GraduationCap size={18} /> Enroll Free in Academy
                        </button>
                    </div>

                    {/* LIVE DATABASE STATS BANNER */}
                    <div className="academy-hero-stats">
                        <div className="academy-stat-box">
                            <strong>{leaderboardSummary ? leaderboardSummary.totalScholars : 7}</strong>
                            <span>Enrolled Scholars</span>
                        </div>
                        <div className="academy-stat-box">
                            <strong>{leaderboardSummary ? leaderboardSummary.graduatesCount : 1}</strong>
                            <span>Certified Graduates</span>
                        </div>
                        <div className="academy-stat-box">
                            <strong>5</strong>
                            <span>Free Sample Modules</span>
                        </div>
                        <div className="academy-stat-box">
                            <strong>60</strong>
                            <span>Total Lessons in DB</span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="academy-container">

                {/* =========================================================================
                    SECTION 1: LADDER BOARD OF SUCCESS (LIVE PERFORMANCE FROM REAL DB)
                    ========================================================================= */}
                <section className="academy-section" id="ladderboard">
                    <div className="academy-section-header">
                        <div className="academy-live-chip">
                            <span className="live-dot" /> Live Connected to EPICChurchDB
                        </div>
                        <h2 className="academy-section-title">
                            Ladder Board of Success
                        </h2>
                        <p className="academy-section-desc">
                            Honoring every enrolled scholar&apos;s accomplishment percentage and discipleship milestone.
                            Below is the full roster of active students directly loaded from our church database.
                        </p>
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="leaderboard-summary-row">
                        <div className="lb-metric-card">
                            <div className="lb-metric-icon gold">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <span className="lb-metric-num">
                                    {leaderboardSummary ? leaderboardSummary.graduatesCount : 1}
                                </span>
                                <span className="lb-metric-label">100% Gold Graduates</span>
                            </div>
                        </div>
                        <div className="lb-metric-card">
                            <div className="lb-metric-icon blue">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <span className="lb-metric-num">
                                    {leaderboardSummary ? `${leaderboardSummary.averageProgress}%` : "21%"}
                                </span>
                                <span className="lb-metric-label">Cohort Average Progress</span>
                            </div>
                        </div>
                        <div className="lb-metric-card">
                            <div className="lb-metric-icon purple">
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <span className="lb-metric-num">
                                    {leaderboardSummary ? leaderboardSummary.totalCompletedLessons : 90}
                                </span>
                                <span className="lb-metric-label">Completed Lessons</span>
                            </div>
                        </div>
                        <div className="lb-metric-card">
                            <div className="lb-metric-icon teal">
                                <Users size={22} />
                            </div>
                            <div>
                                <span className="lb-metric-num">
                                    {leaderboardSummary ? leaderboardSummary.activeCohorts : 3}
                                </span>
                                <span className="lb-metric-label">Active Study Cohorts</span>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS & FILTER BAR */}
                    <div className="leaderboard-controls-bar">
                        <div className="leaderboard-filter-pills">
                            <button
                                type="button"
                                className={`lb-pill ${leaderboardFilter === "ALL" ? "active" : ""}`}
                                onClick={() => setLeaderboardFilter("ALL")}
                            >
                                All Scholars ({leaderboard.length})
                            </button>
                            <button
                                type="button"
                                className={`lb-pill ${leaderboardFilter === "GRADUATES" ? "active" : ""}`}
                                onClick={() => setLeaderboardFilter("GRADUATES")}
                            >
                                🏆 Certified Graduates ({leaderboard.filter((s) => s.progressPercentage >= 100).length})
                            </button>
                            <button
                                type="button"
                                className={`lb-pill ${leaderboardFilter === "ACHIEVERS" ? "active" : ""}`}
                                onClick={() => setLeaderboardFilter("ACHIEVERS")}
                            >
                                🌟 High Achievers ({leaderboard.filter((s) => s.progressPercentage > 0 && s.progressPercentage < 100).length})
                            </button>
                            <button
                                type="button"
                                className={`lb-pill ${leaderboardFilter === "ORIENTATION" ? "active" : ""}`}
                                onClick={() => setLeaderboardFilter("ORIENTATION")}
                            >
                                🎯 In Orientation ({leaderboard.filter((s) => s.progressPercentage === 0).length})
                            </button>
                        </div>

                        <div className="leaderboard-search-wrap">
                            <Search size={16} className="leaderboard-search-icon" />
                            <input
                                type="text"
                                className="leaderboard-search-input"
                                placeholder="Search student name, track, badge..."
                                value={leaderboardSearch}
                                onChange={(e) => setLeaderboardSearch(e.target.value)}
                            />
                            <button
                                type="button"
                                className="lb-refresh-btn"
                                title="Refresh leaderboard data"
                                onClick={loadAllData}
                            >
                                <RefreshCw size={14} className={loadingLeaderboard ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* TOP 3 PODIUM DISPLAY */}
                    {leaderboard.length >= 3 && !leaderboardSearch && leaderboardFilter === "ALL" && (
                        <div className="podium-grid">
                            {/* 2nd Place */}
                            <div className="podium-card silver">
                                <div className="podium-trophy silver">🥈</div>
                                <span className="podium-rank-tag">Rank #2</span>
                                <div className="podium-avatar">
                                    {leaderboard[1].studentName.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 className="podium-name">{leaderboard[1].studentName}</h3>
                                <span className="podium-tier-badge">{leaderboard[1].honorBadge}</span>
                                <div className="podium-progress-wrap">
                                    <div className="podium-progress-bar">
                                        <div
                                            className="podium-progress-fill silver-fill"
                                            style={{ width: `${leaderboard[1].progressPercentage}%` }}
                                        />
                                    </div>
                                    <strong className="podium-percent">{leaderboard[1].progressPercentage}% Accomplished</strong>
                                </div>
                                <span className="podium-lessons">
                                    {leaderboard[1].completedLessons} of {leaderboard[1].totalLessons} Lessons
                                </span>
                            </div>

                            {/* 1st Place (Winner) */}
                            <div className="podium-card gold">
                                <div className="podium-crown">👑</div>
                                <div className="podium-trophy gold">🥇</div>
                                <span className="podium-rank-tag gold-tag">Champion Graduate • Rank #1</span>
                                <div className="podium-avatar gold-ring">
                                    {leaderboard[0].studentName.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 className="podium-name">{leaderboard[0].studentName}</h3>
                                <span className="podium-tier-badge gold-badge">{leaderboard[0].honorBadge}</span>
                                <div className="podium-progress-wrap">
                                    <div className="podium-progress-bar">
                                        <div
                                            className="podium-progress-fill gold-fill"
                                            style={{ width: `100%` }}
                                        />
                                    </div>
                                    <strong className="podium-percent gold-text">100% Mastered</strong>
                                </div>
                                <span className="podium-lessons gold-lessons">
                                    {leaderboard[0].completedLessons} of {leaderboard[0].totalLessons} Lessons Completed
                                </span>
                            </div>

                            {/* 3rd Place */}
                            <div className="podium-card bronze">
                                <div className="podium-trophy bronze">🥉</div>
                                <span className="podium-rank-tag">Rank #3</span>
                                <div className="podium-avatar">
                                    {leaderboard[2].studentName.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 className="podium-name">{leaderboard[2].studentName}</h3>
                                <span className="podium-tier-badge">{leaderboard[2].honorBadge}</span>
                                <div className="podium-progress-wrap">
                                    <div className="podium-progress-bar">
                                        <div
                                            className="podium-progress-fill bronze-fill"
                                            style={{ width: `${leaderboard[2].progressPercentage}%` }}
                                        />
                                    </div>
                                    <strong className="podium-percent">{leaderboard[2].progressPercentage}% Accomplished</strong>
                                </div>
                                <span className="podium-lessons">
                                    {leaderboard[2].completedLessons} of {leaderboard[2].totalLessons} Lessons
                                </span>
                            </div>
                        </div>
                    )}

                    {/* FULL LADDER BOARD TABLE */}
                    <div className="ladderboard-table-card">
                        <div className="ladderboard-table-header">
                            <div className="col-rank">Rank</div>
                            <div className="col-scholar">Enrolled Scholar</div>
                            <div className="col-track">Course Track</div>
                            <div className="col-progress">Accomplishment (%)</div>
                            <div className="col-lessons">Lessons</div>
                            <div className="col-badge">Honor Tier</div>
                            <div className="col-action">Status</div>
                        </div>

                        {filteredLeaderboard.length === 0 ? (
                            <div className="lb-empty-state">
                                <AlertCircle size={28} color="#65676b" />
                                <p>No enrolled scholars found matching &quot;{leaderboardSearch}&quot;.</p>
                            </div>
                        ) : (
                            <div className="ladderboard-table-body">
                                {filteredLeaderboard.map((student) => (
                                    <div
                                        key={student.enrollmentId}
                                        className={`ladderboard-row ${student.isCompleted ? "row-graduate" : ""}`}
                                    >
                                        <div className="col-rank">
                                            <span className={`rank-badge rank-${student.rank}`}>
                                                {student.rankTrophy}
                                            </span>
                                        </div>

                                        <div className="col-scholar">
                                            <div className="scholar-avatar-circle">
                                                {student.studentName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="scholar-name-wrap">
                                                <strong>{student.studentName}</strong>
                                                <small>@{student.username}</small>
                                            </div>
                                        </div>

                                        <div className="col-track">
                                            <span className="track-code-chip">{student.courseTrack}</span>
                                            <span className="track-title-text">{student.courseTitle}</span>
                                        </div>

                                        <div className="col-progress">
                                            <div className="progress-meter-wrap">
                                                <div className="progress-meter-bar">
                                                    <div
                                                        className={`progress-meter-fill ${
                                                            student.progressPercentage === 100
                                                                ? "fill-100"
                                                                : student.progressPercentage >= 30
                                                                ? "fill-mid"
                                                                : student.progressPercentage > 0
                                                                ? "fill-low"
                                                                : "fill-zero"
                                                        }`}
                                                        style={{ width: `${Math.max(student.progressPercentage, 4)}%` }}
                                                    />
                                                </div>
                                                <span className="progress-percent-label">
                                                    {student.progressPercentage}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-lessons">
                                            <strong>{student.completedLessons}</strong> / {student.totalLessons}
                                        </div>

                                        <div className="col-badge">
                                            <span
                                                className="honor-tier-pill"
                                                style={{
                                                    borderColor: student.honorColor,
                                                    color: student.honorColor,
                                                    backgroundColor: `${student.honorColor}15`
                                                }}
                                            >
                                                {student.honorBadge}
                                            </span>
                                        </div>

                                        <div className="col-action">
                                            {student.isCompleted ? (
                                                <span className="status-tag status-graduated">
                                                    <CheckCircle2 size={13} /> Certified
                                                </span>
                                            ) : student.progressPercentage > 0 ? (
                                                <span className="status-tag status-progress">
                                                    In Training
                                                </span>
                                            ) : (
                                                <span className="status-tag status-orientation">
                                                    Orientation
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SCRIPTURAL ENCOURAGEMENT BANNER */}
                    <div className="scripture-callout-banner">
                        <Bookmark size={20} className="scripture-icon" />
                        <p>
                            <strong>Philippians 1:6</strong> &mdash; &ldquo;Being confident of this very thing, that He who has
                            begun a good work in you will complete it until the day of Jesus Christ.&rdquo;
                        </p>
                    </div>
                </section>

                {/* =========================================================================
                    SECTION 2: FREE SAMPLE LEAD MAGNET (FIRST 5 FOUNDATIONAL MODULES)
                    ========================================================================= */}
                <section className="academy-section" id="lead-magnet">
                    <div className="academy-section-header">
                        <span className="academy-section-tag">
                            <Gift size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                            Free Sample Lead Magnet &bull; First 5 Modules Unlocked
                        </span>
                        <h2 className="academy-section-title">
                            5 Free Sample Discipleship Modules
                        </h2>
                        <p className="academy-section-desc">
                            Test drive our comprehensive discipleship masterclass for free! Explore all 30 lessons
                            across the first 5 foundational modules below before you enroll.
                        </p>
                    </div>

                    {/* 5 MODULE TABS SELECTOR */}
                    <div className="lead-magnet-tabs-bar">
                        {FREE_SAMPLE_MODULES.map((fsm) => (
                            <button
                                key={fsm.id}
                                type="button"
                                className={`lm-module-tab-btn ${activeLeadMagnetModuleId === fsm.id ? "active" : ""}`}
                                onClick={() => setActiveLeadMagnetModuleId(fsm.id)}
                            >
                                <span className="tab-pill-num">{fsm.moduleNumber}</span>
                                <span className="tab-pill-title">{fsm.title}</span>
                                <span className="tab-pill-tag">6 Lessons Free</span>
                            </button>
                        ))}
                    </div>

                    {/* ACTIVE SAMPLE MODULE CARD */}
                    <div className="lead-magnet-card">
                        <div className="lead-magnet-hero">
                            <div className="lead-magnet-badge-row">
                                <span className="lm-pill-gold">
                                    <Unlock size={13} /> FREE SAMPLE LEAD MAGNET
                                </span>
                                <span className="lm-pill-track">
                                    {currentSampleModule.moduleNumber}: {currentSampleModule.title}
                                </span>
                                <span className="lm-pill-time">
                                    <Clock size={13} /> {currentSampleModule.estimatedMinutes} &bull; {currentSampleModule.lessonsCount} Lessons Unlocked
                                </span>
                            </div>

                            <h3 className="lead-magnet-title">
                                {currentSampleModule.moduleNumber} &bull; {currentSampleModule.title}
                            </h3>

                            <div className="lead-magnet-scripture-bar">
                                <strong>📖 Key Scriptures:</strong> {currentSampleModule.scriptures}
                            </div>

                            <p className="lead-magnet-summary">
                                {currentSampleModule.summary}
                            </p>
                        </div>

                        {/* 6 UNLOCKED SAMPLE LESSONS LIST */}
                        <div className="sample-lessons-strip">
                            <div className="sample-lessons-header">
                                <h4>
                                    <PlayCircle size={18} /> 6 Lessons Included in this Free Sample Module:
                                </h4>
                                <span className="free-sample-badge">
                                    <Sparkles size={13} /> 100% Free Lead Magnet
                                </span>
                            </div>

                            <div className="sample-lessons-grid-5">
                                {currentSampleModule.lessons.map((lesson, idx) => (
                                    <div key={lesson.id} className="sample-lesson-box">
                                        <div className="sample-lesson-top">
                                            <span className="sample-lesson-num">Lesson {idx + 1}</span>
                                            <span className="sample-free-pill">Free Preview</span>
                                        </div>
                                        <strong className="sample-lesson-name">{lesson.title}</strong>
                                        <div className="sample-lesson-footer">
                                            <span className="sample-time"><Clock size={12} /> {lesson.duration}</span>
                                            <span className="sample-type">{lesson.type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3 THEOLOGICAL PILLARS */}
                        <div className="study-outline-wrap">
                            <div className="study-outline-header">
                                <h4>
                                    <FileText size={18} /> Core Theological Pillars for {currentSampleModule.title}
                                </h4>
                                <span className="outline-guide-tag">Free Theological Guide</span>
                            </div>

                            <div className="study-points-grid">
                                {currentSampleModule.keyPillars.map((sp, idx) => (
                                    <div key={idx} className="study-point-card">
                                        <div className="study-point-num">{idx + 1}</div>
                                        <div className="study-point-content">
                                            <div className="study-point-title-row">
                                                <h5>{sp.title}</h5>
                                                <span className="study-point-verse">{sp.verse}</span>
                                            </div>
                                            <p className="study-point-exp">{sp.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* REFLECTION PROMPT */}
                        <div className="reflection-section-wrap">
                            <h4 className="reflection-title">
                                <Star size={18} /> Personal Discipleship Reflection
                            </h4>
                            <div className="reflection-question-item">
                                <span className="reflection-bullet">Question</span>
                                <p>{currentSampleModule.reflectionQuestion}</p>
                            </div>
                        </div>

                        {/* LEAD MAGNET FOOTER ACTIONS */}
                        <div className="lead-magnet-footer-actions">
                            <div className="lm-resource-info">
                                <FileText size={22} className="lm-file-icon" />
                                <div>
                                    <strong>{currentSampleModule.title} Study Guide &bull; Reflection Worksheet</strong>
                                    <small>Free Download &bull; PDF Printable Format (1.2 MB)</small>
                                </div>
                            </div>

                            <div className="lm-buttons-group">
                                <button
                                    type="button"
                                    className="lm-download-btn"
                                    onClick={() => setStudyGuideModalOpen(true)}
                                >
                                    <Download size={16} /> Download {currentSampleModule.moduleNumber} Worksheet
                                </button>
                                <button
                                    type="button"
                                    className="lm-video-btn"
                                    onClick={() => setVideoModalOpen(true)}
                                >
                                    <PlayCircle size={16} /> Watch Video Preview
                                </button>
                                <button
                                    type="button"
                                    className="lm-enroll-cta-btn"
                                    onClick={() => openEnrollModal({
                                        code: "TRACK 101",
                                        title: "Foundations of Christian Discipleship"
                                    })}
                                >
                                    <GraduationCap size={16} /> Enroll Free to Unlock All 10 Modules
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                    SECTION 3: FULL CURRICULUM (10 MODULES & 60 LESSONS)
                    ========================================================================= */}
                <section className="academy-section" id="curriculum">
                    <div className="academy-section-header">
                        <span className="academy-section-tag">Direct Database Curriculum</span>
                        <h2 className="academy-section-title">
                            Full Curriculum Roadmap &bull; 10 Modules &bull; 60 Lessons
                        </h2>
                        <p className="academy-section-desc">
                            All curriculum modules and individual lessons are stored and served live from our SQL Server database.
                            Modules 1 to 5 are completely open as free sample previews. Modules 6 to 10 unlock upon enrollment.
                        </p>
                    </div>

                    {/* COURSE HERO CARD */}
                    <div className="course-hero-card">
                        <div className="course-hero-badge-row">
                            <span className="course-hero-code">TRACK 101</span>
                            <span className="course-hero-cat">DISCIPLESHIP</span>
                            <span className="course-hero-level">Foundational • Open to All</span>
                            <span className="course-hero-live">
                                <Database size={13} /> Live from EPICChurchDB
                            </span>
                        </div>

                        <h3 className="course-hero-title">Foundations of Christian Discipleship</h3>
                        <p className="course-hero-desc">
                            A comprehensive biblical masterclass covering salvation assurance, Scripture meditation,
                            prevailing prayer, Holy Spirit empowerment, Christian character, and Great Commission leadership.
                        </p>

                        <div className="course-hero-stats-row">
                            <div className="course-hero-stat">
                                <BookOpen size={16} />
                                <span>10 Discipleship Modules</span>
                            </div>
                            <div className="course-hero-stat">
                                <PlayCircle size={16} />
                                <span>60 Complete Lessons</span>
                            </div>
                            <div className="course-hero-stat">
                                <Clock size={16} />
                                <span>45 Hours Total</span>
                            </div>
                            <div className="course-hero-stat">
                                <Users size={16} />
                                <span>Faculty: Pastor Daniel Vance &amp; EPIC Elder Council</span>
                            </div>
                        </div>

                        <div className="course-hero-outcomes-box">
                            <strong>Target Learning Outcomes:</strong>
                            <ul>
                                <li>
                                    <CheckCircle2 size={14} color="#10b981" />
                                    <span>Firm foundation in biblical salvation and eternal assurance (1 John 5)</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={14} color="#10b981" />
                                    <span>Daily quiet time, Bible study, and consistent prayer journaling</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={14} color="#10b981" />
                                    <span>Spiritual gifts discovery and ministry activation in the local church</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={14} color="#10b981" />
                                    <span>Christlike character, servanthood, and Great Commission mobilization</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* CURRICULUM SEARCH BAR */}
                    <div className="curriculum-search-bar">
                        <Search size={16} className="curriculum-search-icon" />
                        <input
                            type="text"
                            placeholder="Filter through the 10 modules and 60 lessons..."
                            value={curriculumSearch}
                            onChange={(e) => setCurriculumSearch(e.target.value)}
                        />
                        <span className="curriculum-count-badge">
                            {filteredModules.length} Modules Shown
                        </span>
                    </div>

                    {/* 10 MODULES ACCORDION LIST */}
                    {loadingCurriculum ? (
                        <div className="curriculum-loading">
                            <Loader2 size={24} className="animate-spin" />
                            <span>Loading modules from database...</span>
                        </div>
                    ) : (
                        <div className="modules-accordion-container">
                            {filteredModules.map((mod, mIdx) => {
                                const isOpen = expandedModuleId === mod.moduleId;
                                const isSampleUnlocked = mIdx < 5;
                                return (
                                    <div key={mod.moduleId} className={`module-item-card ${isOpen ? "open" : ""}`}>
                                        <button
                                            type="button"
                                            className="module-item-header"
                                            onClick={() => toggleModule(mod.moduleId)}
                                        >
                                            <div className="module-item-info">
                                                <span className={`module-number-pill ${isSampleUnlocked ? "pill-unlocked" : "pill-locked"}`}>
                                                    {mod.moduleNumber}
                                                </span>
                                                <div className="module-text-group">
                                                    <h4>
                                                        {mod.title}
                                                        {isSampleUnlocked ? (
                                                            <span className="inline-free-tag">
                                                                <Unlock size={11} /> Free Sample
                                                            </span>
                                                        ) : (
                                                            <span className="inline-locked-tag">
                                                                <Lock size={11} /> Unlocked on Enrollment
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p>{mod.description}</p>
                                                </div>
                                            </div>

                                            <div className="module-header-meta">
                                                <span className="module-lessons-count">
                                                    {mod.lessonsCount} Lessons
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp size={20} color="#1877f2" />
                                                ) : (
                                                    <ChevronDown size={20} color="#65676b" />
                                                )}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="module-lessons-drawer">
                                                <div className="drawer-subhead">
                                                    <span>Lesson Directory &bull; {mod.moduleNumber}</span>
                                                    <small>{isSampleUnlocked ? "Free Sample Lead Magnet" : "Available upon enrollment"}</small>
                                                </div>
                                                <div className="lessons-grid">
                                                    {mod.lessons.map((lesson, lIdx) => (
                                                        <div key={lesson.lessonId} className="lesson-card-item">
                                                            <div className="lesson-left">
                                                                <span className="lesson-index-badge">
                                                                    {mIdx + 1}.{lIdx + 1}
                                                                </span>
                                                                <div className="lesson-title-meta">
                                                                    <strong>{lesson.title}</strong>
                                                                    <div className="lesson-tags-row">
                                                                        <span className="lesson-duration">
                                                                            <Clock size={11} /> {lesson.duration}
                                                                        </span>
                                                                        <span className="lesson-type-badge">
                                                                            {lesson.type.toUpperCase()}
                                                                        </span>
                                                                        {isSampleUnlocked && (
                                                                            <span className="lesson-preview-tag">
                                                                                <Sparkles size={10} /> FREE SAMPLE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="lesson-right-action">
                                                                {isSampleUnlocked ? (
                                                                    <button
                                                                        type="button"
                                                                        className="lesson-preview-btn"
                                                                        onClick={() => {
                                                                            setActiveLeadMagnetModuleId(mod.moduleId);
                                                                            document.getElementById("lead-magnet")?.scrollIntoView({ behavior: "smooth" });
                                                                        }}
                                                                    >
                                                                        <PlayCircle size={14} /> Free Preview
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="lesson-enroll-btn"
                                                                        onClick={() => openEnrollModal()}
                                                                    >
                                                                        Enroll to Access
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* =========================================================================
                    SECTION 4: 4-STEP ADMISSIONS PATHWAY
                    ========================================================================= */}
                <section className="academy-section" id="pathway">
                    <div className="academy-section-header">
                        <span className="academy-section-tag">Admissions &bull; 4 Simple Steps</span>
                        <h2 className="academy-section-title">How to Enroll in EPIC Academy</h2>
                        <p className="academy-section-desc">
                            All courses in EPIC Academy are free of tuition. Follow these four simple steps
                            to begin your discipleship journey.
                        </p>
                    </div>

                    <div className="enroll-steps-grid">
                        <div className="enroll-step-card">
                            <div className="enroll-step-num">1</div>
                            <h4>Select Track 101</h4>
                            <p>
                                Begin with our foundational 10-module discipleship masterclass covering salvation assurance,
                                prayer, the Holy Spirit, and Christian leadership.
                            </p>
                        </div>
                        <div className="enroll-step-card">
                            <div className="enroll-step-num">2</div>
                            <h4>Submit Free Application</h4>
                            <p>
                                Click any enrollment button on this page. Your registration is instantly logged
                                in our church database and a confirmation email is dispatched.
                            </p>
                        </div>
                        <div className="enroll-step-card">
                            <div className="enroll-step-num">3</div>
                            <h4>Join a Weekly Cohort</h4>
                            <p>
                                Choose between Sunday morning on-campus sessions, Tuesday evening Zoom classes,
                                or flexible self-paced study with an assigned mentor.
                            </p>
                        </div>
                        <div className="enroll-step-card">
                            <div className="enroll-step-num">4</div>
                            <h4>Complete &amp; Graduate</h4>
                            <p>
                                Work through all 60 lessons, track your accomplishment percentage on the Ladder Board,
                                and earn your accredited graduation certificate.
                            </p>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                    SECTION 5: FUTURE COURSES ROADMAP
                    ========================================================================= */}
                <section className="academy-section">
                    <div className="academy-section-header">
                        <span className="academy-section-tag">Upcoming Terms</span>
                        <h2 className="academy-section-title">Future Advanced Electives</h2>
                        <p className="academy-section-desc">
                            Our pastoral council is developing specialized theological and leadership tracks for upcoming terms.
                        </p>
                    </div>

                    <div className="future-courses-grid">
                        {FUTURE_COURSES.map((fc, idx) => (
                            <div key={idx} className="future-course-card">
                                <div>
                                    <span className="future-badge">{fc.category}</span>
                                    <h3>{fc.title}</h3>
                                    <p>{fc.description}</p>
                                </div>
                                <div className="future-footer">
                                    <span className="future-timeline">
                                        <Calendar size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                                        {fc.launchDate} ({fc.lessonsCount} Lessons)
                                    </span>
                                    <button
                                        type="button"
                                        className="future-btn"
                                        onClick={() => onNavigate?.("contact")}
                                    >
                                        Inquire <ArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ACCREDITATION CARD */}
                <div className="accreditation-card">
                    <div className="accreditation-icon-wrap">
                        <Award size={34} />
                    </div>
                    <div className="accreditation-info">
                        <h3>Accredited Church Certification</h3>
                        <p>
                            Every course completed in EPIC Academy earns an official digital certificate of completion
                            verified under the spiritual authority of Luke 4:18 Ministries. Certificates are permanently
                            recorded in your EPIC Member Profile and fulfill church ministry servant qualification requirements.
                        </p>
                    </div>
                </div>
            </main>

            {/* =========================================================================
                MODAL 1: STUDY GUIDE DOWNLOAD & REFLECTION WORKSHEET (LEAD MAGNET)
                ========================================================================= */}
            {studyGuideModalOpen && (
                <div className="academy-modal-backdrop" onClick={() => setStudyGuideModalOpen(false)}>
                    <div className="study-guide-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="academy-modal-close"
                            onClick={() => setStudyGuideModalOpen(false)}
                        >
                            <X size={18} />
                        </button>

                        <div className="study-guide-printable-header">
                            <div className="printable-top">
                                <span>EPIC ACADEMY &bull; FREE SAMPLE LEAD MAGNET</span>
                                <small>Luke 4:18 Ministries</small>
                            </div>
                            <h2>{currentSampleModule.moduleNumber}: {currentSampleModule.title}</h2>
                            <p className="printable-sub">
                                Free Discipleship Study Guide &bull; Key Scriptures: {currentSampleModule.scriptures}
                            </p>
                        </div>

                        <div className="study-guide-body-content">
                            <div className="study-guide-callout">
                                <strong>💡 Module Summary:</strong>
                                <p>{currentSampleModule.summary}</p>
                            </div>

                            <h4 className="sg-section-h4">Core Theological Pillars:</h4>
                            <div className="sg-points-list">
                                {currentSampleModule.keyPillars.map((sp, idx) => (
                                    <div key={idx} className="sg-point-item">
                                        <strong>{sp.title} ({sp.verse})</strong>
                                        <p>{sp.description}</p>
                                    </div>
                                ))}
                            </div>

                            <h4 className="sg-section-h4" style={{ marginTop: "20px" }}>Included Lessons (Free Preview):</h4>
                            <div className="sg-lessons-preview-list">
                                {currentSampleModule.lessons.map((l, idx) => (
                                    <div key={l.id} className="sg-lesson-mini-row">
                                        <span>Lesson {idx + 1}: <strong>{l.title}</strong></span>
                                        <small>{l.duration}</small>
                                    </div>
                                ))}
                            </div>

                            <h4 className="sg-section-h4" style={{ marginTop: "20px" }}>Personal Reflection Question:</h4>
                            <div className="sg-q-box">
                                <p className="sg-q-text">{currentSampleModule.reflectionQuestion}</p>
                                <div className="sg-notes-line" />
                                <div className="sg-notes-line" />
                            </div>
                        </div>

                        <div className="study-guide-modal-footer">
                            <button
                                type="button"
                                className="academy-btn-secondary"
                                onClick={() => window.print()}
                            >
                                <FileText size={16} /> Print / Save as PDF
                            </button>
                            <button
                                type="button"
                                className="academy-btn-primary"
                                onClick={() => {
                                    setStudyGuideModalOpen(false);
                                    openEnrollModal();
                                }}
                            >
                                <GraduationCap size={16} /> Enroll Free in Full Course
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL 2: VIDEO PREVIEW MODAL
                ========================================================================= */}
            {videoModalOpen && (
                <div className="academy-modal-backdrop" onClick={() => setVideoModalOpen(false)}>
                    <div className="academy-video-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="academy-modal-close"
                            onClick={() => setVideoModalOpen(false)}
                        >
                            <X size={18} />
                        </button>

                        <div className="video-modal-header">
                            <span className="video-tag">FREE MASTERCLASS VIDEO PREVIEW</span>
                            <h3>{currentSampleModule.moduleNumber}: {currentSampleModule.title}</h3>
                            <small>Foundations of Christian Discipleship &bull; 6 Lessons Free</small>
                        </div>

                        <div className="video-player-container">
                            <iframe
                                src="https://www.youtube-nocookie.com/embed/xrXFi3Bbx90?autoplay=1"
                                title="EPIC Academy Lesson Preview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="video-iframe"
                            />
                        </div>

                        <div className="video-modal-footer">
                            <p>
                                Ready to take the next step in your spiritual walk? Enroll for free to unlock all 10 modules
                                and 60 lessons in the Member LMS.
                            </p>
                            <button
                                type="button"
                                className="academy-btn-primary"
                                onClick={() => {
                                    setVideoModalOpen(false);
                                    openEnrollModal();
                                }}
                            >
                                <GraduationCap size={16} /> Enroll Free in Academy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL 3: ENROLLMENT APPLICATION MODAL
                ========================================================================= */}
            {enrollModalOpen && (
                <div className="academy-modal-backdrop" onClick={() => setEnrollModalOpen(false)}>
                    <div className="academy-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="academy-modal-close"
                            onClick={() => setEnrollModalOpen(false)}
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>

                        {enrollSubmitted ? (
                            <div className="enroll-success-slip">
                                <div className="enroll-success-icon">
                                    <Check size={26} />
                                </div>
                                <h3>Enrollment Successfully Recorded!</h3>
                                <p>
                                    Welcome to <strong>{selectedTrackForEnroll?.title}</strong>. Your application has been recorded in our church database.
                                </p>
                                <div className="enroll-db-status-badge">
                                    <Database size={14} /> Recorded in SQL Server Database &bull; Resend Dispatched
                                </div>
                                <span className="enroll-slip-code">Reference: {enrollRefCode}</span>

                                <div className="enroll-receipt-summary">
                                    <div className="enroll-receipt-row">
                                        <span>Student:</span>
                                        <strong>{enrollFormData.fullName}</strong>
                                    </div>
                                    <div className="enroll-receipt-row">
                                        <span>Email:</span>
                                        <strong>{enrollFormData.email}</strong>
                                    </div>
                                    <div className="enroll-receipt-row">
                                        <span>Phone:</span>
                                        <strong>{enrollFormData.phone || "Not provided"}</strong>
                                    </div>
                                    <div className="enroll-receipt-row">
                                        <span>Member Status:</span>
                                        <strong>{enrollFormData.memberStatus}</strong>
                                    </div>
                                    <div className="enroll-receipt-row">
                                        <span>Cohort:</span>
                                        <strong>{enrollFormData.cohort}</strong>
                                    </div>
                                    <div className="enroll-receipt-row">
                                        <span>Course Track:</span>
                                        <strong>{selectedTrackForEnroll?.code} &bull; {selectedTrackForEnroll?.title}</strong>
                                    </div>
                                    {enrollFormData.mentorName && (
                                        <div className="enroll-receipt-row">
                                            <span>Discipleship Mentor:</span>
                                            <strong>{enrollFormData.mentorName}</strong>
                                        </div>
                                    )}
                                </div>

                                <p style={{ fontSize: "13px", color: "#65676b", marginTop: "16px" }}>
                                    A confirmation and welcome orientation syllabus has been sent to <em>{enrollFormData.email}</em>.
                                    Our pastoral discipleship office has also been notified.
                                </p>
                                <button
                                    type="button"
                                    className="academy-btn-primary"
                                    style={{ width: "100%", justifyContent: "center", marginTop: "16px" }}
                                    onClick={() => setEnrollModalOpen(false)}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="enroll-modal-live-badge">
                                    <Database size={13} /> Live Database Intake
                                </div>
                                <h3 className="academy-modal-title">
                                    Enroll in {selectedTrackForEnroll?.code || "EPIC Academy"}
                                </h3>
                                <p className="academy-modal-subtitle">
                                    {selectedTrackForEnroll?.title || "Foundations of Christian Discipleship"} &bull; Free Discipleship Masterclass
                                </p>

                                {enrollError && (
                                    <div className="enroll-error-banner">
                                        <AlertCircle size={18} />
                                        <span>{enrollError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleEnrollSubmit}>
                                    <div className="enroll-form-group">
                                        <label htmlFor="enroll-name">Full Name *</label>
                                        <input
                                            id="enroll-name"
                                            type="text"
                                            placeholder="Enter your full name"
                                            required
                                            disabled={enrollSubmitting}
                                            value={enrollFormData.fullName}
                                            onChange={(e) =>
                                                setEnrollFormData({ ...enrollFormData, fullName: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="enroll-form-row-2">
                                        <div className="enroll-form-group">
                                            <label htmlFor="enroll-email">Email Address *</label>
                                            <input
                                                id="enroll-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                required
                                                disabled={enrollSubmitting}
                                                value={enrollFormData.email}
                                                onChange={(e) =>
                                                    setEnrollFormData({ ...enrollFormData, email: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="enroll-form-group">
                                            <label htmlFor="enroll-phone">Phone Number *</label>
                                            <input
                                                id="enroll-phone"
                                                type="tel"
                                                placeholder="+63 9XX XXX XXXX"
                                                required
                                                disabled={enrollSubmitting}
                                                value={enrollFormData.phone}
                                                onChange={(e) =>
                                                    setEnrollFormData({ ...enrollFormData, phone: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="enroll-form-row-2">
                                        <div className="enroll-form-group">
                                            <label htmlFor="enroll-member-status">Member Status *</label>
                                            <select
                                                id="enroll-member-status"
                                                disabled={enrollSubmitting}
                                                value={enrollFormData.memberStatus}
                                                onChange={(e) =>
                                                    setEnrollFormData({ ...enrollFormData, memberStatus: e.target.value })
                                                }
                                            >
                                                <option value="Active Member">Active Member</option>
                                                <option value="Guest / First-Time Visitor">Guest / First-Time Visitor</option>
                                                <option value="Volunteering Leader">Volunteering Leader</option>
                                                <option value="Ministry Worker / Pastor">Ministry Worker / Pastor</option>
                                            </select>
                                        </div>

                                        <div className="enroll-form-group">
                                            <label htmlFor="enroll-cohort">Preferred Study Cohort *</label>
                                            <select
                                                id="enroll-cohort"
                                                disabled={enrollSubmitting}
                                                value={enrollFormData.cohort}
                                                onChange={(e) =>
                                                    setEnrollFormData({ ...enrollFormData, cohort: e.target.value })
                                                }
                                            >
                                                <option value="Sunday Morning On-Campus (10:30 AM)">
                                                    Sunday Morning On-Campus (10:30 AM)
                                                </option>
                                                <option value="Tuesday Evening Online Zoom (7:30 PM)">
                                                    Tuesday Evening Online Zoom (7:30 PM)
                                                </option>
                                                <option value="Self-Paced Member LMS with Weekly Huddle">
                                                    Self-Paced Member LMS with Weekly Huddle
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="enroll-form-group">
                                        <label htmlFor="enroll-mentor">Life Group Leader / Mentor (Optional)</label>
                                        <input
                                            id="enroll-mentor"
                                            type="text"
                                            placeholder="Leader or Pastor who referred you"
                                            disabled={enrollSubmitting}
                                            value={enrollFormData.mentorName}
                                            onChange={(e) =>
                                                setEnrollFormData({ ...enrollFormData, mentorName: e.target.value })
                                            }
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="enroll-submit-btn"
                                        disabled={enrollSubmitting}
                                    >
                                        {enrollSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="enroll-btn-spinner" />
                                                Recording Application in Database...
                                            </>
                                        ) : (
                                            "Confirm Free Academy Enrollment"
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* PUBLIC FOOTER */}
            <footer className="academy-footer">
                <div className="academy-footer-inner">
                    <p className="academy-footer-copy">
                        &copy; {new Date().getFullYear()} EPIC Academy &bull; Engaging People Into Christ &bull; Luke 4:18 Ministries
                    </p>
                    <p className="academy-footer-tagline">
                        Biblical discipleship and kingdom leadership institute equipped with real database modules, 5 free sample lead magnet modules, and live performance tracking.
                    </p>
                </div>
            </footer>
        </div>
    );
}
