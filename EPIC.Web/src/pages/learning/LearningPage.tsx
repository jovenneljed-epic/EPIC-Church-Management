import React, {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    BookOpen,
    GraduationCap,
    CheckCircle2,
    TrendingUp,
    Play,
    Compass,
    ArrowRight,
    Calendar,
    Sparkles,
    Award,
    Heart,
    Users,
    AlertCircle,
    Lock,
    ShieldAlert
} from "lucide-react";

import "./LearningPage.css";
import ViewCourse from "./ViewCourse";
import { CurriculumStudio } from "./CurriculumStudio";
import PermissionService from "../../PermissionService";
import { epicGenerationsCurriculumService, type StageLockInfo } from "../../services/epicGenerationsCurriculum";

import { API_BASE_URL } from "../../config";

// =========================================================
// TYPES
// =========================================================

interface Course {
    courseId: number;
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnailUrl?: string | null;
    lessons?: any[];
    lessonCount?: number;
}

interface Enrollment {
    courseEnrollmentId: number;
    courseId: number;
    courseTitle?: string;
    enrolledDate?: string;
    completedDate?: string | null;
    isCompleted: boolean;
    progressPercentage: number;
    course?: Course;
    lessonProgresses?: any[];
    lockInfo?: StageLockInfo;
}

interface LearningPageProps {
    onViewCourse?: (courseId: number) => void;
}

// =========================================================
// COMPONENT
// =========================================================

const LearningPage: React.FC<LearningPageProps> = ({
    onViewCourse
}) => {

    // =====================================================
    // AUTH TOKEN
    // =====================================================

    const getToken = (): string | null => {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken")
        );
    };

    // =====================================================
    // STATE
    // =====================================================

    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * null = LMS homepage
     *
     * number = ViewCourse page
     */
    const [selectedCourseId, setSelectedCourseId] =
        useState<number | null>(null);

    // Sequential stage prerequisite locking state
    const [lockedModal, setLockedModal] =
        useState<StageLockInfo | null>(null);

    // Option for administrators/pastors to toggle bypass during testing/authoring
    const [bypassAdminLock, setBypassAdminLock] =
        useState<boolean>(false);

    const isCurriculumSpecialist =
        PermissionService.isAdministrator() ||
        PermissionService.canCreate("EPIC Learning");

    const [viewMode, setViewMode] =
        useState<"studio" | "student">("studio");

    // =====================================================
    // CURRENT USER
    // =====================================================

    const currentUser =
        localStorage.getItem("currentFullName") ||
        localStorage.getItem("currentUser") ||
        "Learner";

    // =====================================================
    // API REQUEST
    // =====================================================

    const apiRequest = async (
        url: string,
        options: RequestInit = {}
    ): Promise<any> => {

        const token = getToken();

        if (!token) {
            throw new Error(
                "Authentication token not found."
            );
        }

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,

                headers: {
                    Authorization:
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "EPIC API ERROR:",
                response.status,
                errorText
            );

            throw new Error(
                `API Error ${response.status}`
            );
        }

        return response.json();
    };

    // =====================================================
    // LOAD LEARNING DATA
    // =====================================================

    const loadLearningData = async () => {

        try {

            setLoading(true);
            setError("");

            // -------------------------------------------------
            // GET COURSES
            // -------------------------------------------------

            let apiCourseData: any[] = [];
            try {
                apiCourseData = await apiRequest("/Courses");
            } catch (courseErr) {
                console.warn("Notice: Backend courses fetch failed, fallback to local:", courseErr);
            }

            const normTitle = (t: string) =>
                (t || "")
                    .toLowerCase()
                    .replace(/^stage\s*\d+\s*:\s*/i, "")
                    .replace(/\(gen-\d+\)/i, "")
                    .replace(/[^a-z0-9]/g, "");

            const genCourses = epicGenerationsCurriculumService.getGenerationsAsCourses();
            const courseList: Course[] = [...genCourses];
            if (Array.isArray(apiCourseData)) {
                for (const ac of apiCourseData) {
                    const acNorm = normTitle(ac.title);
                    const isStageDuplicate =
                        epicGenerationsCurriculumService.isGenerationsCourse(ac.courseId) ||
                        courseList.some((c) => {
                            const cNorm = normTitle(c.title);
                            return c.courseId === ac.courseId || cNorm === acNorm || (acNorm.length > 5 && (cNorm.includes(acNorm) || acNorm.includes(cNorm)));
                        });

                    if (!isStageDuplicate) {
                        courseList.push(ac);
                    }
                }
            }

            console.log(
                "EPIC COURSES:",
                courseList
            );

            // -------------------------------------------------
            // GET USER ENROLLMENTS
            // -------------------------------------------------

            const enrollmentResults =
                await Promise.all(
                    courseList.map(
                        async (course) => {

                            try {

                                const enrollment =
                                    await apiRequest(
                                        `/Enrollments/course/${course.courseId}`
                                    );

                                console.log(
                                    `Enrollment for course ${course.courseId}:`,
                                    enrollment
                                );

                                return {
                                    ...enrollment,
                                    course
                                } as Enrollment;

                            } catch (err) {

                                /*
                                 * A 404 normally means that
                                 * the current user is not
                                 * enrolled in this course.
                                 */

                                console.log(
                                    `Not enrolled in course ${course.courseId}`
                                );

                                return null;
                            }
                        }
                    )
                );

            const validEnrollments =
                enrollmentResults.filter(
                    (
                        item
                    ): item is Enrollment =>
                        item !== null
                );

            console.log(
                "EPIC USER ENROLLMENTS:",
                validEnrollments
            );

            // Ensure all 5 stage courses have enrollment representations with sequential stage lock info
            const genEnrollments: Enrollment[] = genCourses.map((gc) => {
                const stage = epicGenerationsCurriculumService.parseStageFromCourseId(gc.courseId) || 1;
                const stageProg = epicGenerationsCurriculumService.getStageProgress(stage);
                const lockInfo = epicGenerationsCurriculumService.getStageLockInfo(stage, bypassAdminLock);

                return {
                    courseEnrollmentId: 1000 + gc.courseId,
                    courseId: gc.courseId,
                    courseTitle: gc.title,
                    enrolledDate: "2026-11-01",
                    completedDate: stageProg.isCompleted ? "2026-11-04" : null,
                    isCompleted: stageProg.isCompleted,
                    progressPercentage: stageProg.progressPercentage,
                    course: gc,
                    lessonProgresses: [],
                    lockInfo
                };
            });

            const combinedEnrollments = [...genEnrollments];
            for (const ve of validEnrollments) {
                if (!combinedEnrollments.some((ce) => ce.courseId === ve.courseId)) {
                    combinedEnrollments.push(ve);
                }
            }

            setEnrollments(
                combinedEnrollments
            );

        } catch (err) {

            console.error(
                "EPIC Learning loading error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your learning information."
            );

        } finally {

            setLoading(false);

        }
    };

    // Auto-open course if directed from Church in Action
    useEffect(() => {
        try {
            const targetId = localStorage.getItem("epic_target_course_id");
            if (targetId) {
                localStorage.removeItem("epic_target_course_id");
                const id = Number(targetId);
                if (id > 0) {
                    if (onViewCourse) {
                        onViewCourse(id);
                    } else {
                        setSelectedCourseId(id);
                    }
                }
            }
        } catch {}
    }, [onViewCourse]);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        if (!isCurriculumSpecialist || viewMode === "student") {
            loadLearningData();
        } else {
            setLoading(false);
        }

    }, [isCurriculumSpecialist, viewMode]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const enrolledCount =
        enrollments.length;

    const completedCount =
        enrollments.filter(
            enrollment =>
                enrollment.isCompleted === true ||
                Number(
                    enrollment.progressPercentage || 0
                ) >= 100
        ).length;

    const overallProgress =
        enrolledCount > 0
            ? Math.round(
                enrollments.reduce(
                    (
                        total,
                        enrollment
                    ) =>
                        total +
                        Number(
                            enrollment.progressPercentage || 0
                        ),
                    0
                ) / enrolledCount
            )
            : 0;

    const inProgressCount =
        enrollments.filter(
            enrollment =>
                enrollment.isCompleted !== true &&
                Number(
                    enrollment.progressPercentage || 0
                ) > 0
        ).length;

    // =====================================================
    // LATEST ENROLLMENT
    // =====================================================

    const latestEnrollment =
        useMemo(() => {

            if (!enrollments.length) {
                return null;
            }

            return [...enrollments].sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.completedDate ||
                            a.enrolledDate ||
                            0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.completedDate ||
                            b.enrolledDate ||
                            0
                        ).getTime();

                    return dateB - dateA;
                }
            )[0];

        }, [enrollments]);

    // =====================================================
    // HERO COURSE
    // =====================================================

    const heroEnrollment =
        useMemo(() => {

            if (!enrollments.length) {
                return null;
            }

            // Find an active in-progress course that is NOT locked
            const inProgress =
                enrollments.find(
                    enrollment => {
                        const stage = epicGenerationsCurriculumService.parseStageFromCourseId(enrollment.courseId);
                        const isLocked = stage ? epicGenerationsCurriculumService.isStageLocked(stage, bypassAdminLock) : false;
                        return !isLocked &&
                            enrollment.isCompleted !== true &&
                            Number(
                                enrollment.progressPercentage || 0
                            ) > 0;
                    }
                );

            if (inProgress) {
                return inProgress;
            }

            // Fallback to the first unlocked course that is not completed (e.g. Stage 1 if 0%)
            const earliestUnlocked =
                enrollments.find(
                    enrollment => {
                        const stage = epicGenerationsCurriculumService.parseStageFromCourseId(enrollment.courseId);
                        const isLocked = stage ? epicGenerationsCurriculumService.isStageLocked(stage, bypassAdminLock) : false;
                        return !isLocked && enrollment.isCompleted !== true;
                    }
                );

            if (earliestUnlocked) {
                return earliestUnlocked;
            }

            return enrollments[0];

        }, [enrollments, bypassAdminLock]);

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        date?: string | null
    ): string => {

        if (!date) {
            return "—";
        }

        const parsed =
            new Date(date);

        if (
            isNaN(
                parsed.getTime()
            )
        ) {
            return "—";
        }

        return parsed.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    };

    // =====================================================
    // THUMBNAIL
    // =====================================================

    const getThumbnail = (
        enrollment: Enrollment
    ): string | null => {

        const thumbnail =
            enrollment.course?.thumbnailUrl;

        if (!thumbnail) {
            return null;
        }

        if (
            thumbnail.startsWith("http://") ||
            thumbnail.startsWith("https://")
        ) {
            return thumbnail;
        }

        const apiRoot =
            API_BASE_URL.replace(
                "/api/proxy",
                ""
            ).replace(
                "/api",
                ""
            );

        return (
            `${apiRoot}` +
            `${thumbnail.startsWith("/")
                ? ""
                : "/"}` +
            `${thumbnail}`
        );
    };

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const openCourse = (
        enrollment: Enrollment
    ) => {

        const courseId =
            Number(
                enrollment.courseId
            );

        console.log(
            "================================="
        );

        console.log(
            "EPIC OPEN COURSE"
        );

        console.log(
            "Enrollment:",
            enrollment
        );

        console.log(
            "Course ID:",
            courseId
        );

        console.log(
            "Course Title:",
            enrollment.courseTitle ||
            enrollment.course?.title
        );

        console.log(
            "================================="
        );

        if (!courseId) {

            console.error(
                "Cannot open course: courseId is missing.",
                enrollment
            );

            return;
        }

        // Enforce sequential stage prerequisite locking
        const stage = epicGenerationsCurriculumService.parseStageFromCourseId(courseId);
        if (stage) {
            const lockInfo = epicGenerationsCurriculumService.getStageLockInfo(stage, bypassAdminLock);
            if (lockInfo.isLocked) {
                console.warn(`[EPIC Learning] Stage ${stage} is locked. Prerequisite required: Stage ${lockInfo.requiredStage}.`);
                setLockedModal(lockInfo);
                return;
            }
        }

        /*
         * If parent component supplied
         * onViewCourse, use it.
         */

        if (onViewCourse) {

            onViewCourse(
                courseId
            );

            return;
        }

        /*
         * Otherwise display ViewCourse
         * internally.
         */

        setSelectedCourseId(
            courseId
        );
    };

    // =====================================================
    // BACK TO LMS
    // =====================================================

    const handleBackToLearning = () => {

        console.log(
            "Returning to EPIC Learning..."
        );

        setSelectedCourseId(
            null
        );

        loadLearningData();
    };

    // =====================================================
    // VIEW COURSE
    // =====================================================

    if (
        selectedCourseId !== null
    ) {

        return (
            <ViewCourse
                courseId={
                    selectedCourseId
                }
                onBack={
                    handleBackToLearning
                }
            />
        );
    }

    // =====================================================
    // CURRICULUM SPECIALIST & ADMINISTRATOR STUDIO
    // High-priority studio view for curriculum makers & administrators
    // =====================================================

    if (isCurriculumSpecialist && viewMode === "studio") {
        return (
            <CurriculumStudio
                onSwitchToLearnerView={() => {
                    setViewMode("student");
                    loadLearningData();
                }}
                onViewCourse={(courseId) => {
                    if (onViewCourse) {
                        onViewCourse(courseId);
                    } else {
                        setSelectedCourseId(courseId);
                    }
                }}
            />
        );
    }

    // =====================================================
    // LOADING (LEARNER VIEW)
    // =====================================================

    if (loading) {

        return (
            <div className="learning-page-loading">

                <div className="learning-loading-spinner" />

                <h2>
                    Loading EPIC Learning...
                </h2>

                <p>
                    Preparing your learning journey.
                </p>

            </div>
        );
    }

    // =====================================================
    // ERROR (LEARNER VIEW)
    // =====================================================

    if (error) {

        return (
            <div className="learning-error">

                <div className="learning-error-icon">
                    <AlertCircle size={28} />
                </div>

                <h2>
                    EPIC Learning
                </h2>

                <p>
                    {error}
                </p>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                        type="button"
                        className="learning-retry-btn"
                        onClick={
                            loadLearningData
                        }
                    >
                        Try Again
                    </button>
                    {isCurriculumSpecialist && (
                        <button
                            type="button"
                            className="learning-retry-btn"
                            style={{ background: "#4f46e5" }}
                            onClick={() => setViewMode("studio")}
                        >
                            Open Curriculum Studio
                        </button>
                    )}
                </div>

            </div>
        );
    }

    // =====================================================
    // MAIN LMS (LEARNER VIEW)
    // =====================================================

    return (

        <div className="epic-learning-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="learning-hero">

                <div className="learning-hero-content">

                    <div className="learning-eyebrow">
                        <Sparkles size={13} className="eyebrow-sparkle" />
                        <span>YOUR LEARNING JOURNEY</span>
                    </div>

                    <h1 className="learning-hero-title">
                        Welcome Back,
                        <br />
                        <span className="learning-hero-name">{currentUser}!</span>
                    </h1>

                    <p className="learning-hero-description">
                        Continue your journey of faith and deepen your understanding of God's Word.
                    </p>

                    <div className="learning-verse-box">
                        <p className="learning-verse">
                            “But grow in the grace and knowledge of our Lord and Savior Jesus Christ.”
                        </p>
                        <strong className="learning-verse-ref">
                            — 2 Peter 3:18
                        </strong>
                    </div>

                    <div className="learning-hero-buttons">

                        {heroEnrollment && (

                            <button
                                type="button"
                                className="learning-primary-btn"
                                onClick={() =>
                                    openCourse(
                                        heroEnrollment
                                    )
                                }
                            >
                                <Play size={16} fill="currentColor" />
                                <span>
                                    {
                                        Number(
                                            heroEnrollment.progressPercentage || 0
                                        ) > 0
                                            ? "Continue Learning"
                                            : "Start Learning"
                                    }
                                </span>
                            </button>

                        )}

                        <button
                            type="button"
                            className="learning-secondary-btn"
                            onClick={() => {

                                window.dispatchEvent(
                                    new CustomEvent(
                                        "epic-explore-courses"
                                    )
                                );

                            }}
                        >
                            <Compass size={16} />
                            <span>Explore Courses</span>
                        </button>

                        <button
                            type="button"
                            className="learning-secondary-btn"
                            style={{ borderColor: "#0d9488", color: "#0d9488", background: "rgba(13, 148, 136, 0.08)", gap: "6px" }}
                            onClick={() => {
                                window.history.pushState({}, "", "/cms/my-journey");
                                window.dispatchEvent(new PopStateEvent("popstate"));
                            }}
                        >
                            <span>🎯</span>
                            <span>My Transformation Journey</span>
                        </button>

                        {isCurriculumSpecialist && (
                            <button
                                type="button"
                                className="learning-primary-btn"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", marginLeft: "8px" }}
                                onClick={() => setViewMode("studio")}
                            >
                                <Sparkles size={16} />
                                <span>Curriculum Studio (Author Mode)</span>
                            </button>
                        )}

                    </div>

                </div>

                {/* =================================================
                    HERO VISUAL / FEATURED ACTIVE CARD
                ================================================= */}

                <div className="learning-hero-visual">

                    {heroEnrollment ? (
                        <div className="hero-featured-card">
                            <div className="hero-card-header">
                                <span className="hero-track-pill">
                                    <span className="hero-track-dot" />
                                    <span>ACTIVE DISCIPLESHIP TRACK</span>
                                </span>
                                <span className="hero-track-pct">
                                    {Number(heroEnrollment.progressPercentage || 0)}%
                                </span>
                            </div>

                            <div className="hero-card-body">
                                <div className="hero-card-icon-wrap">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="hero-card-title">
                                    {heroEnrollment.courseTitle || heroEnrollment.course?.title || "Foundations of Faith"}
                                </h3>
                                <p className="hero-card-mentor">
                                    Mentor: <strong>Pastor Ronnel M. Aviguetero</strong>
                                </p>

                                <div className="hero-card-progress-wrap">
                                    <div className="hero-progress-track">
                                        <div
                                            className="hero-progress-fill"
                                            style={{
                                                width: `${Math.max(4, Math.min(100, Number(heroEnrollment.progressPercentage || 0)))}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="hero-card-action-btn"
                                    onClick={() => openCourse(heroEnrollment)}
                                >
                                    <span>{Number(heroEnrollment.progressPercentage || 0) > 0 ? "Resume Course" : "Start Course"}</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="hero-featured-card empty-track">
                            <div className="hero-card-icon-wrap">
                                <GraduationCap size={32} />
                            </div>
                            <h3>EPIC Discipleship Center</h3>
                            <p>Deepen your spiritual foundation with certified leadership tracks.</p>
                            <button
                                type="button"
                                className="hero-card-action-btn"
                                onClick={() => {
                                    window.dispatchEvent(
                                        new CustomEvent("epic-explore-courses")
                                    );
                                }}
                            >
                                <span>Browse Catalog</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    )}

                </div>

            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="epic-learning-stats-container">
                <div className="learning-stat-card">

                    <div className="learning-stat">
                        <div className="learning-stat-icon blue">
                            <BookOpen size={22} />
                        </div>
                        <div className="learning-stat-info">
                            <span>Enrolled Courses</span>
                            <strong>{enrolledCount}</strong>
                            <small>Courses enrolled</small>
                        </div>
                    </div>

                    <div className="learning-stat-divider" />

                    <div className="learning-stat">
                        <div className="learning-stat-icon green">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="learning-stat-info">
                            <span>Completed</span>
                            <strong>{completedCount}</strong>
                            <small>Courses completed</small>
                        </div>
                    </div>

                    <div className="learning-stat-divider" />

                    <div className="learning-stat">
                        <div className="learning-stat-icon yellow">
                            <TrendingUp size={22} />
                        </div>
                        <div className="learning-stat-info">
                            <span>Overall Progress</span>
                            <strong>{overallProgress}%</strong>
                            <small>Across enrolled courses</small>
                        </div>
                    </div>

                    <div className="learning-stat-divider" />

                    <div className="learning-stat">
                        <div className="learning-stat-icon purple">
                            <GraduationCap size={22} />
                        </div>
                        <div className="learning-stat-info">
                            <span>Learning Status</span>
                            <strong className="learning-status-text">
                                {
                                    enrolledCount === 0
                                        ? "Not Started"
                                        : completedCount === enrolledCount
                                            ? "Completed"
                                            : "In Progress"
                                }
                            </strong>
                            <small>
                                {
                                    inProgressCount > 0
                                        ? `${inProgressCount} course${inProgressCount > 1 ? "s" : ""} in progress`
                                        : enrolledCount === 0
                                            ? "No courses enrolled"
                                            : "Keep growing"
                                }
                            </small>
                        </div>
                    </div>

                </div>
            </section>

            {/* =================================================
                MY LEARNING
            ================================================= */}

            <section className="my-learning-section">

                <div className="learning-section-header">
                    <div>
                        <div className="learning-section-title">
                            <div className="section-title-icon-box">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h2>My Learning</h2>
                                <p>Continue where you left off</p>
                            </div>
                        </div>
                    </div>

                    <span className="learning-course-count">
                        {enrolledCount} enrolled
                    </span>
                </div>

                {/* =================================================
                    SEQUENTIAL PROGRESSION INFO BANNER
                ================================================= */}
                <div className="sequential-pathway-banner">
                    <div className="sequential-pathway-left">
                        <div className="pathway-icon-circle">
                            <Lock size={16} />
                        </div>
                        <div>
                            <strong>Sequential Discipleship Progression Enforced</strong>
                            <p>
                                Stages unlock sequentially according to biblical discipleship (2 Timothy 2:2). Learners must finish 100% of the lower stage before advancing to higher stages.
                            </p>
                        </div>
                    </div>
                    {isCurriculumSpecialist && (
                        <button
                            type="button"
                            className={`admin-toggle-prereq-btn ${bypassAdminLock ? "is-bypassed" : ""}`}
                            onClick={() => {
                                const nextState = !bypassAdminLock;
                                setBypassAdminLock(nextState);
                                loadLearningData();
                            }}
                            title="Admins/Pastors can toggle this to test higher stages"
                        >
                            {bypassAdminLock ? "🔓 Pastor Bypass: ON" : "🔒 Enforce Locking (Default)"}
                        </button>
                    )}
                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {enrollments.length === 0 ? (

                    <div className="learning-empty">
                        <div className="learning-empty-icon">
                            <BookOpen size={48} />
                        </div>
                        <h3>No courses enrolled yet</h3>
                        <p>Your enrolled courses will appear here as you begin your discipleship journey.</p>
                    </div>

                ) : (

                    <div className="learning-course-grid">

                        {enrollments.map(
                            enrollment => {

                                const stage = epicGenerationsCurriculumService.parseStageFromCourseId(enrollment.courseId);
                                const lockInfo = stage
                                    ? epicGenerationsCurriculumService.getStageLockInfo(stage, bypassAdminLock)
                                    : enrollment.lockInfo;
                                const isLocked = lockInfo ? lockInfo.isLocked : false;

                                const progress =
                                    Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            Number(
                                                enrollment.progressPercentage || 0
                                            )
                                        )
                                    );

                                const completed =
                                    enrollment.isCompleted === true ||
                                    progress >= 100;

                                const course =
                                    enrollment.course;

                                const thumbnail =
                                    getThumbnail(
                                        enrollment
                                    );

                                const lessonCount =
                                    course?.lessonCount ??
                                    course?.lessons?.length ?? 30;

                                return (

                                    <article
                                        className={`learning-course-card ${isLocked ? "is-locked" : ""}`}
                                        key={
                                            enrollment.courseEnrollmentId
                                        }
                                    >

                                        {/* COURSE IMAGE */}

                                        <div className="learning-course-image">

                                            {thumbnail ? (

                                                <img
                                                    src={
                                                        thumbnail
                                                    }
                                                    alt={
                                                        enrollment.courseTitle ||
                                                        course?.title ||
                                                        "Course"
                                                    }
                                                />

                                            ) : (

                                                <div className="learning-course-image-placeholder">
                                                    <BookOpen size={48} />
                                                </div>

                                            )}

                                            {isLocked ? (
                                                <span className="course-status locked">
                                                    <Lock size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
                                                    Locked (Stage {lockInfo?.requiredStage} Req)
                                                </span>
                                            ) : (
                                                <span
                                                    className={
                                                        completed
                                                            ? "course-status completed"
                                                            : "course-status"
                                                    }
                                                >
                                                    {
                                                        completed
                                                            ? "Completed"
                                                            : progress > 0
                                                                ? "In Progress"
                                                                : "Not Started"
                                                    }
                                                </span>
                                            )}

                                            {isLocked && (
                                                <div className="course-locked-overlay">
                                                    <div className="course-locked-overlay-content">
                                                        <Lock size={28} />
                                                        <span>Stage {stage} Locked</span>
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                        {/* COURSE CONTENT */}

                                        <div className="learning-course-content">

                                            <h3>
                                                {
                                                    enrollment.courseTitle ||
                                                    course?.title ||
                                                    "Untitled Course"
                                                }
                                            </h3>

                                            <p className="learning-course-description">
                                                {
                                                    course?.shortDescription ||
                                                    course?.description ||
                                                    "Continue growing in faith and biblical understanding."
                                                }
                                            </p>

                                            {/* PREREQUISITE NOTICE IF LOCKED */}
                                            {isLocked && lockInfo && (
                                                <div className="course-locked-banner">
                                                    <Lock size={15} style={{ flexShrink: 0, marginTop: 2, color: "#d97706" }} />
                                                    <div>
                                                        <strong>Prerequisite:</strong> Complete 100% of{" "}
                                                        <em>Stage {lockInfo.requiredStage}: {lockInfo.requiredStageTitle}</em>{" "}
                                                        to unlock ({lockInfo.requiredStageCompletedCount}/{lockInfo.requiredStageTotalLessons} lessons).
                                                    </div>
                                                </div>
                                            )}

                                            {/* PROGRESS */}

                                            <div className="course-progress-row">
                                                <div className="course-progress-bar">
                                                    <div
                                                        className={
                                                            completed
                                                                ? "course-progress-fill completed"
                                                                : "course-progress-fill"
                                                        }
                                                        style={{
                                                            width: `${progress}%`
                                                        }}
                                                    />
                                                </div>
                                                <strong>
                                                    {progress}%
                                                </strong>
                                            </div>

                                            {/* META */}

                                            <div className="course-meta">
                                                <div className="course-meta-info">
                                                    <span>
                                                        <BookOpen size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
                                                        {lessonCount} Lessons
                                                    </span>

                                                    {enrollment.enrolledDate && (
                                                        <span>
                                                            <Calendar size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
                                                            Enrolled{" "}
                                                            {
                                                                formatDate(
                                                                    enrollment.enrolledDate
                                                                )
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ACTION */}

                                            <button
                                                type="button"
                                                className={isLocked ? "course-action-btn locked" : "course-action-btn"}
                                                onClick={() => {
                                                    if (isLocked && lockInfo) {
                                                        setLockedModal(lockInfo);
                                                    } else {
                                                        openCourse(enrollment);
                                                    }
                                                }}
                                            >
                                                {isLocked ? (
                                                    <>
                                                        <Lock size={14} style={{ marginRight: 6 }} />
                                                        <span>Locked — Stage {lockInfo?.requiredStage} Required</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>
                                                            {
                                                                completed
                                                                    ? "View Course"
                                                                    : progress > 0
                                                                        ? "Continue Learning"
                                                                        : "Start Course"
                                                                    }
                                                        </span>
                                                        <ArrowRight size={15} />
                                                    </>
                                                )}
                                            </button>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* =================================================
                LEARNING VALUES
            ================================================= */}

            <section className="learning-values">

                <div className="learning-value">
                    <div className="learning-value-icon blue">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h3>Biblical Foundation</h3>
                        <p>All learning is rooted in God's Word.</p>
                    </div>
                </div>

                <div className="learning-value">
                    <div className="learning-value-icon green">
                        <Users size={22} />
                    </div>
                    <div>
                        <h3>Practical Application</h3>
                        <p>Apply biblical truths in your daily life.</p>
                    </div>
                </div>

                <div className="learning-value">
                    <div className="learning-value-icon yellow">
                        <Heart size={22} />
                    </div>
                    <div>
                        <h3>Christ-Centered</h3>
                        <p>Everything points to Jesus Christ.</p>
                    </div>
                </div>

                <div className="learning-value">
                    <div className="learning-value-icon purple">
                        <Award size={22} />
                    </div>
                    <div>
                        <h3>Grow & Serve</h3>
                        <p>Develop to become a faithful servant.</p>
                    </div>
                </div>

            </section>

            {/* =================================================
                LAST ACTIVITY
            ================================================= */}

            {latestEnrollment && (

                <div className="learning-last-activity">
                    <span>Latest enrollment activity:</span>
                    <strong>
                        {
                            latestEnrollment.courseTitle ||
                            latestEnrollment.course?.title
                        }
                    </strong>
                    <span>
                        {
                            formatDate(
                                latestEnrollment.completedDate ||
                                latestEnrollment.enrolledDate
                            )
                        }
                    </span>
                </div>

            )}

            {/* =================================================
                PREREQUISITE LOCKED STAGE MODAL
            ================================================= */}
            {lockedModal && (
                <div className="epic-prereq-modal-backdrop" onClick={() => setLockedModal(null)}>
                    <div className="epic-prereq-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="epic-prereq-modal-header">
                            <div className="prereq-modal-icon-badge">
                                <Lock size={26} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span className="prereq-pill">SEQUENTIAL DISCIPLESHIP PATHWAY</span>
                                <h3 style={{ margin: "4px 0 2px", fontSize: "19px", color: "#0f172a", fontWeight: "800" }}>
                                    Stage {lockedModal.stage} is Locked
                                </h3>
                                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                    {lockedModal.courseTitle}
                                </p>
                            </div>
                        </div>

                        <div className="epic-prereq-modal-body">
                            <div className="prereq-rule-box">
                                <ShieldAlert size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
                                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#92400e" }}>
                                    At <strong>Luke 4:18 Ministries</strong>, spiritual growth follows a disciplined, step-by-step progression (2 Timothy 2:2). Disciples must complete 100% of the lower stage before unlocking higher stages.
                                </p>
                            </div>

                            <div className="prereq-requirement-card">
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Required Prerequisite:
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", margin: "6px 0 10px" }}>
                                    Stage {lockedModal.requiredStage}: {lockedModal.requiredStageTitle}
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", marginBottom: "6px" }}>
                                    <span>Current Completion:</span>
                                    <strong>{lockedModal.requiredStageProgressPct}% ({lockedModal.requiredStageCompletedCount}/{lockedModal.requiredStageTotalLessons} Lessons)</strong>
                                </div>

                                <div className="prereq-modal-progress-bar">
                                    <div
                                        className="prereq-modal-progress-fill"
                                        style={{ width: `${lockedModal.requiredStageProgressPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="epic-prereq-modal-footer">
                            <button
                                type="button"
                                className="btn-modal-dismiss"
                                onClick={() => setLockedModal(null)}
                            >
                                Close
                            </button>
                            {lockedModal.requiredStageCourseId && (
                                <button
                                    type="button"
                                    className="btn-modal-primary"
                                    onClick={() => {
                                        const reqId = lockedModal.requiredStageCourseId!;
                                        setLockedModal(null);
                                        const prereqEnrollment = enrollments.find((e) => e.courseId === reqId);
                                        if (prereqEnrollment) {
                                            openCourse(prereqEnrollment);
                                        } else {
                                            setSelectedCourseId(reqId);
                                        }
                                    }}
                                >
                                    <span>Go to Stage {lockedModal.requiredStage} Now</span>
                                    <ArrowRight size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LearningPage;