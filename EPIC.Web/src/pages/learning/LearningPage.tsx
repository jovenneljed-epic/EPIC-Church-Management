import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import "./LearningPage.css";
import ViewCourse from "./ViewCourse";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

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
}

// =========================================================
// COMPONENT
// =========================================================

const LearningPage: React.FC = () => {

    // =====================================================
    // AUTH
    // =====================================================

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken");

    // =====================================================
    // STATE
    // =====================================================

    const [courses, setCourses] =
        useState<Course[]>([]);

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
     *
     * Example:
     * selectedCourseId = 1
     * means:
     * <ViewCourse courseId={1} />
     */
    const [selectedCourseId, setSelectedCourseId] =
        useState<number | null>(null);

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
    ) => {

        const response =
            await fetch(
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
                "API ERROR:",
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
    // LOAD COURSES + ENROLLMENTS
    // =====================================================

    const loadLearningData = async () => {

        try {

            setLoading(true);
            setError("");

            // ---------------------------------------------
            // GET ALL COURSES
            // ---------------------------------------------

            const courseData =
                await apiRequest("/Courses");

            const courseList: Course[] =
                Array.isArray(courseData)
                    ? courseData
                    : [];

            console.log(
                "EPIC COURSES:",
                courseList
            );

            setCourses(courseList);

            // ---------------------------------------------
            // GET CURRENT USER ENROLLMENTS
            // ---------------------------------------------

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
                                };

                            }
                            catch (err) {

                                /*
                                 * 404 normally means the
                                 * current user is not enrolled
                                 * in this course.
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

            setEnrollments(
                validEnrollments
            );

        }
        catch (err) {

            console.error(
                "EPIC Learning loading error:",
                err
            );

            setError(
                "Unable to load your learning information."
            );

        }
        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadLearningData();

    }, []);

    // =====================================================
    // STATISTICS
    // =====================================================

    const enrolledCount =
        enrollments.length;

    const completedCount =
        enrollments.filter(
            enrollment =>
                enrollment.isCompleted ||
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
                !enrollment.isCompleted &&
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

            return [
                ...enrollments
            ].sort(
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

            /*
             * First priority:
             * currently in-progress course
             */

            const inProgress =
                enrollments.find(
                    enrollment =>
                        !enrollment.isCompleted &&
                        Number(
                            enrollment.progressPercentage || 0
                        ) > 0
                );

            if (inProgress) {
                return inProgress;
            }

            /*
             * Otherwise use the first
             * enrolled course.
             */

            return enrollments[0];

        }, [enrollments]);

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        date?: string | null
    ) => {

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
    // COURSE THUMBNAIL
    // =====================================================

    const getThumbnail = (
        enrollment: Enrollment
    ) => {

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

        return (
            `${API_BASE_URL.replace("/api", "")}` +
            `${thumbnail.startsWith("/") ? "" : "/"}` +
            thumbnail
        );

    };

    // =====================================================
    // OPEN VIEW COURSE
    // =====================================================

    const openCourse = (
        enrollment: Enrollment
    ) => {

        /*
         * IMPORTANT:
         * We use the actual courseId returned
         * from the database enrollment.
         */

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

        /*
         * This changes the LearningPage state.
         *
         * React will re-render and the
         * ViewCourse block below will display.
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

        /*
         * Reload database progress after
         * returning from ViewCourse.
         */

        loadLearningData();

    };

    // =====================================================
    // VIEW COURSE PAGE
    //
    // VERY IMPORTANT:
    // This MUST be BEFORE the main LMS return.
    // =====================================================

    if (
        selectedCourseId !== null
    ) {

        console.log(
            "Rendering ViewCourse:",
            selectedCourseId
        );

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
    // LOADING
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
    // ERROR
    // =====================================================

    if (error) {

        return (
            <div className="learning-error">

                <div className="learning-error-icon">
                    !
                </div>

                <h2>
                    EPIC Learning
                </h2>

                <p>
                    {error}
                </p>

                <button
                    type="button"
                    className="learning-retry-btn"
                    onClick={
                        loadLearningData
                    }
                >
                    Try Again
                </button>

            </div>
        );

    }

    // =====================================================
    // MAIN LMS PAGE
    // =====================================================

    return (

        <div className="epic-learning-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="learning-hero">

                <div className="learning-hero-content">

                    <div className="learning-eyebrow">
                        YOUR LEARNING JOURNEY
                    </div>

                    <h1>
                        Welcome Back,
                        <br />
                        {currentUser}!
                    </h1>

                    <p className="learning-hero-description">
                        Continue your journey of faith and
                        deepen your understanding of God's Word.
                    </p>

                    <p className="learning-verse">
                        “But grow in the grace and knowledge
                        of our Lord and Savior Jesus Christ.”

                        <strong>
                            — 2 Peter 3:18
                        </strong>
                    </p>

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

                                <span>
                                    ▣
                                </span>

                                {
                                    Number(
                                        heroEnrollment.progressPercentage || 0
                                    ) > 0
                                        ? "Continue Learning"
                                        : "Start Learning"
                                }

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

                            <span>
                                ◇
                            </span>

                            Explore Courses

                        </button>

                    </div>

                </div>

                {/* =================================================
                    HERO VISUAL
                ================================================= */}

                <div className="learning-hero-visual">

                    {heroEnrollment &&
                    getThumbnail(
                        heroEnrollment
                    ) ? (

                        <img
                            src={
                                getThumbnail(
                                    heroEnrollment
                                )!
                            }
                            alt={
                                heroEnrollment.courseTitle ||
                                heroEnrollment.course?.title ||
                                "Course"
                            }
                        />

                    ) : (

                        <div className="learning-book-placeholder">

                            <div className="learning-book-icon">
                                📖
                            </div>

                            <span>
                                EPIC LEARNING
                            </span>

                        </div>

                    )}

                </div>

            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="learning-stat-card">

                <div className="learning-stat">

                    <div className="learning-stat-icon blue">
                        📖
                    </div>

                    <div className="learning-stat-info">

                        <span>
                            Enrolled Courses
                        </span>

                        <strong>
                            {enrolledCount}
                        </strong>

                        <small>
                            Courses enrolled
                        </small>

                    </div>

                </div>

                <div className="learning-stat-divider" />

                <div className="learning-stat">

                    <div className="learning-stat-icon green">
                        ✓
                    </div>

                    <div className="learning-stat-info">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedCount}
                        </strong>

                        <small>
                            Courses completed
                        </small>

                    </div>

                </div>

                <div className="learning-stat-divider" />

                <div className="learning-stat">

                    <div className="learning-stat-icon yellow">
                        ↗
                    </div>

                    <div className="learning-stat-info">

                        <span>
                            Overall Progress
                        </span>

                        <strong>
                            {overallProgress}%
                        </strong>

                        <small>
                            Across enrolled courses
                        </small>

                    </div>

                </div>

                <div className="learning-stat-divider" />

                <div className="learning-stat">

                    <div className="learning-stat-icon purple">
                        🎓
                    </div>

                    <div className="learning-stat-info">

                        <span>
                            Learning Status
                        </span>

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

            </section>

            {/* =================================================
                MY LEARNING
            ================================================= */}

            <section className="my-learning-section">

                <div className="learning-section-header">

                    <div>

                        <div className="learning-section-title">

                            <span>
                                📖
                            </span>

                            <div>

                                <h2>
                                    My Learning
                                </h2>

                                <p>
                                    Continue where you left off
                                </p>

                            </div>

                        </div>

                    </div>

                    <span className="learning-course-count">
                        {enrolledCount} enrolled
                    </span>

                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {enrollments.length === 0 ? (

                    <div className="learning-empty">

                        <div>
                            📚
                        </div>

                        <h3>
                            No courses enrolled yet
                        </h3>

                        <p>
                            Your enrolled courses will appear here.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       COURSE GRID
                    ================================================= */

                    <div className="learning-course-grid">

                        {enrollments.map(
                            enrollment => {

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
                                    enrollment.isCompleted ||
                                    progress >= 100;

                                const course =
                                    enrollment.course;

                                const thumbnail =
                                    getThumbnail(
                                        enrollment
                                    );

                                const lessonCount =
                                    course?.lessonCount ??
                                    course?.lessons?.length;

                                return (

                                    <article
                                        className="learning-course-card"
                                        key={
                                            enrollment.courseEnrollmentId
                                        }
                                    >

                                        {/* =================================================
                                            COURSE IMAGE
                                        ================================================= */}

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
                                                    📖
                                                </div>

                                            )}

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

                                        </div>

                                        {/* =================================================
                                            COURSE CONTENT
                                        ================================================= */}

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

                                            {/* =================================================
                                                PROGRESS
                                            ================================================= */}

                                            <div className="course-progress-row">

                                                <div className="course-progress-bar">

                                                    <div
                                                        className={
                                                            completed
                                                                ? "course-progress-fill completed"
                                                                : "course-progress-fill"
                                                        }
                                                        style={{
                                                            width:
                                                                `${progress}%`
                                                        }}
                                                    />

                                                </div>

                                                <strong>
                                                    {progress}%
                                                </strong>

                                            </div>

                                            {/* =================================================
                                                COURSE META
                                            ================================================= */}

                                            <div className="course-meta">

                                                <div className="course-meta-info">

                                                    {lessonCount !== undefined && (

                                                        <span>
                                                            📖 {lessonCount} Lessons
                                                        </span>

                                                    )}

                                                    {enrollment.enrolledDate && (

                                                        <span>
                                                            📅 Enrolled{" "}
                                                            {
                                                                formatDate(
                                                                    enrollment.enrolledDate
                                                                )
                                                            }
                                                        </span>

                                                    )}

                                                </div>

                                            </div>

                                            {/* =================================================
                                                VIEW / CONTINUE / START BUTTON
                                            ================================================= */}

                                            <button
                                                type="button"
                                                className="course-action-btn"
                                                onClick={() =>
                                                    openCourse(
                                                        enrollment
                                                    )
                                                }
                                            >

                                                <span>
                                                    {
                                                        completed
                                                            ? "View Course"
                                                            : progress > 0
                                                                ? "Continue Learning"
                                                                : "Start Course"
                                                    }
                                                </span>

                                                <span>
                                                    →
                                                </span>

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
                        📖
                    </div>

                    <div>

                        <h3>
                            Biblical Foundation
                        </h3>

                        <p>
                            All learning is rooted in God's Word.
                        </p>

                    </div>

                </div>

                <div className="learning-value">

                    <div className="learning-value-icon green">
                        👥
                    </div>

                    <div>

                        <h3>
                            Practical Application
                        </h3>

                        <p>
                            Apply biblical truths in your daily life.
                        </p>

                    </div>

                </div>

                <div className="learning-value">

                    <div className="learning-value-icon yellow">
                        ♥
                    </div>

                    <div>

                        <h3>
                            Christ-Centered
                        </h3>

                        <p>
                            Everything points to Jesus Christ.
                        </p>

                    </div>

                </div>

                <div className="learning-value">

                    <div className="learning-value-icon purple">
                        🏆
                    </div>

                    <div>

                        <h3>
                            Grow & Serve
                        </h3>

                        <p>
                            Develop to become a faithful servant.
                        </p>

                    </div>

                </div>

            </section>

            {/* =================================================
                LAST ACTIVITY
            ================================================= */}

            {latestEnrollment && (

                <div className="learning-last-activity">

                    <span>
                        Latest enrollment activity:
                    </span>

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

        </div>

    );

};

export default LearningPage;