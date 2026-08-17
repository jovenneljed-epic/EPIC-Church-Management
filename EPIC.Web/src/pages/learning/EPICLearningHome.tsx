import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import "./EPICLearningHome.css";

// =========================================================
// API
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

// =========================================================
// TYPES
// =========================================================

interface Course {
    courseId: number;
    title: string;

    shortDescription?: string | null;
    description?: string | null;

    thumbnailUrl?: string | null;

    category?: string | null;
    level?: string | null;

    estimatedMinutes?: number | null;
    durationMinutes?: number | null;

    isPublished?: boolean;
    isFeatured?: boolean;

    lessonCount?: number;
    totalLessons?: number;
}

interface LessonProgress {
    lessonProgressId?: number;
    courseEnrollmentId?: number;
    lessonId?: number;

    progressPercentage?: number;
    isCompleted?: boolean;

    startedDate?: string | null;
    completedDate?: string | null;
}

interface Enrollment {
    courseEnrollmentId: number;
    courseId: number;

    userId?: number;

    enrolledDate?: string | null;
    completedDate?: string | null;

    isCompleted: boolean;
    progressPercentage: number;

    lessonProgresses?: LessonProgress[];

    course?: Course | null;
}

interface LearningCourse {
    course: Course;
    enrollment: Enrollment | null;
}

// =========================================================
// PROPS
// =========================================================

interface EPICLearningHomeProps {
    onViewCourse: (courseId: number) => void;
}

// =========================================================
// ERROR TYPE
// =========================================================

interface ApiError extends Error {
    status?: number;
}

// =========================================================
// COMPONENT
// =========================================================

const EPICLearningHome: React.FC<EPICLearningHomeProps> = ({
    onViewCourse
}) => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const getToken = useCallback((): string | null => {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken")
        );

    }, []);

    // =====================================================
    // USER
    // =====================================================

    const currentUser =
        localStorage.getItem("currentFullName") ||
        localStorage.getItem("currentUser") ||
        "EPIC Member";

    const currentRole =
        localStorage.getItem("currentRole") ||
        "Member";

    // =====================================================
    // STATE
    // =====================================================

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [learningCourses, setLearningCourses] =
        useState<LearningCourse[]>([]);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [error, setError] =
        useState<string | null>(null);

    const [enrollingCourseId, setEnrollingCourseId] =
        useState<number | null>(null);

    const [enrollError, setEnrollError] =
        useState<string | null>(null);

    // =====================================================
    // API REQUEST
    // =====================================================

    const apiRequest = useCallback(
        async <T,>(
            endpoint: string,
            options: RequestInit = {}
        ): Promise<T> => {

            const token = getToken();

            if (!token) {

                throw new Error(
                    "Authentication token not found. Please log in again."
                );
            }

            const headers = new Headers(
                options.headers
            );

            headers.set(
                "Accept",
                "application/json"
            );

            headers.set(
                "Authorization",
                `Bearer ${token}`
            );

            if (options.body) {

                headers.set(
                    "Content-Type",
                    "application/json"
                );
            }

            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

            const responseText =
                await response.text();

            let data: any = null;

            if (responseText) {

                try {

                    data =
                        JSON.parse(
                            responseText
                        );

                } catch {

                    data =
                        responseText;
                }
            }

            if (!response.ok) {

                const message =
                    data?.message ||
                    data?.title ||
                    (
                        typeof data === "string"
                            ? data
                            : `Request failed with status ${response.status}.`
                    );

                const apiError =
                    new Error(message) as ApiError;

                apiError.status =
                    response.status;

                throw apiError;
            }

            return data as T;
        },
        [getToken]
    );

    // =====================================================
    // LOAD COURSES
    // =====================================================

    const loadCourses = useCallback(
        async (): Promise<Course[]> => {

            const data =
                await apiRequest<Course[]>(
                    "/Courses"
                );

            if (!Array.isArray(data)) {

                return [];
            }

            return data.filter(
                course =>
                    course.isPublished !== false
            );
        },
        [apiRequest]
    );

    // =====================================================
    // GET ENROLLMENT
    // =====================================================

    const getCourseEnrollment = useCallback(
        async (
            courseId: number
        ): Promise<Enrollment | null> => {

            try {

                const enrollment =
                    await apiRequest<Enrollment>(
                        `/Enrollments/course/${courseId}`
                    );

                return enrollment;

            } catch (error) {

                const apiError =
                    error as ApiError;

                // 404 simply means:
                // user has not enrolled yet.

                if (
                    apiError.status === 404
                ) {

                    return null;
                }

                throw error;
            }
        },
        [apiRequest]
    );

    // =====================================================
    // LOAD ALL LEARNING DATA
    // =====================================================

    const loadLearningData = useCallback(
        async () => {

            try {

                setLoading(true);
                setError(null);
                setEnrollError(null);

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC LEARNING: LOADING"
                );

                console.log(
                    "================================="
                );

                // -------------------------------------------------
                // LOAD COURSES
                // -------------------------------------------------

                const courseList =
                    await loadCourses();

                console.log(
                    "EPIC COURSES:",
                    courseList
                );

                setCourses(courseList);

                // -------------------------------------------------
                // LOAD ENROLLMENTS
                // -------------------------------------------------

                const learningData =
                    await Promise.all(
                        courseList.map(
                            async course => {

                                const enrollment =
                                    await getCourseEnrollment(
                                        course.courseId
                                    );

                                return {
                                    course,
                                    enrollment
                                };
                            }
                        )
                    );

                console.log(
                    "EPIC LEARNING DATA:",
                    learningData
                );

                setLearningCourses(
                    learningData
                );

            } catch (error) {

                console.error(
                    "EPIC Learning loading error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load EPIC Learning."
                );

            } finally {

                setLoading(false);
            }

        },
        [
            loadCourses,
            getCourseEnrollment
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadLearningData();

    }, [loadLearningData]);

    // =====================================================
    // ENROLLED COURSES
    // =====================================================

    const enrolledCourses =
        useMemo(
            () =>
                learningCourses.filter(
                    item =>
                        item.enrollment !== null
                ),
            [learningCourses]
        );

    // =====================================================
    // COMPLETED COURSES
    // =====================================================

    const completedCourses =
        useMemo(
            () =>
                enrolledCourses.filter(
                    item =>
                        item.enrollment
                            ?.isCompleted === true
                ),
            [enrolledCourses]
        );

    // =====================================================
    // OVERALL PROGRESS
    // =====================================================

    const overallProgress =
        useMemo(() => {

            if (
                enrolledCourses.length === 0
            ) {

                return 0;
            }

            const total =
                enrolledCourses.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        (
                            item.enrollment
                                ?.progressPercentage || 0
                        ),
                    0
                );

            return Math.round(
                total /
                enrolledCourses.length
            );

        }, [enrolledCourses]);

    // =====================================================
    // CONTINUE COURSE
    // =====================================================

    const continueCourse =
        useMemo(() => {

            const active =
                enrolledCourses.find(
                    item =>
                        item.enrollment &&
                        !item.enrollment.isCompleted &&
                        item.enrollment.progressPercentage < 100
                );

            return (
                active ||
                enrolledCourses[0] ||
                null
            );

        }, [enrolledCourses]);

    // =====================================================
    // LAST ACTIVE COURSE
    // =====================================================

    const lastActive =
        useMemo(() => {

            if (
                enrolledCourses.length === 0
            ) {

                return null;
            }

            return [
                ...enrolledCourses
            ].sort(
                (
                    a,
                    b
                ) => {

                    const dateA =
                        new Date(
                            a.enrollment?.enrolledDate || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.enrollment?.enrolledDate || 0
                        ).getTime();

                    return dateB - dateA;
                }
            )[0];

        }, [enrolledCourses]);

    // =====================================================
    // HELPERS
    // =====================================================

    const clampProgress = (
        value?: number | null
    ): number => {

        return Math.min(
            100,
            Math.max(
                0,
                Number(value) || 0
            )
        );
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        date?: string | null
    ): string => {

        if (!date) {

            return "";
        }

        const parsed =
            new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "";
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
        course: Course
    ): string | null => {

        if (
            !course.thumbnailUrl
        ) {

            return null;
        }

        const thumbnail =
            course.thumbnailUrl.trim();

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
                /\/api\/?$/,
                ""
            );

        return (
            `${apiRoot}${thumbnail.startsWith("/") ? "" : "/"}${thumbnail}`
        );
    };

    // =====================================================
    // LESSON COUNT
    // =====================================================

    const getLessonCount = (
        course: Course,
        enrollment?: Enrollment | null
    ): number => {

        return (
            course.lessonCount ??
            course.totalLessons ??
            enrollment?.lessonProgresses?.length ??
            0
        );
    };

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const openCourse = useCallback(
        (courseId: number) => {

            console.log(
                "================================="
            );

            console.log(
                "EPIC LEARNING: OPEN COURSE"
            );

            console.log(
                "Course ID:",
                courseId
            );

            console.log(
                "================================="
            );

            if (!courseId) {

                console.error(
                    "Cannot open course: invalid course ID."
                );

                return;
            }

            // Direct communication with App.tsx.
            onViewCourse(courseId);

        },
        [onViewCourse]
    );

    // =====================================================
    // OPEN LIBRARY
    // =====================================================

    const openLibrary = useCallback(() => {

        const library =
            document.getElementById(
                "lms-course-library"
            );

        if (!library) {

            console.warn(
                "EPIC Learning library element not found."
            );

            return;
        }

        library.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, []);

    // =====================================================
    // ENROLL
    // =====================================================

    const enrollInCourse = useCallback(
        async (
            courseId: number
        ) => {

            if (
                enrollingCourseId !== null
            ) {

                return;
            }

            try {

                setEnrollError(null);

                setEnrollingCourseId(
                    courseId
                );

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC ENROLLMENT"
                );

                console.log(
                    "Course ID:",
                    courseId
                );

                console.log(
                    "POST:",
                    `${API_BASE_URL}/Enrollments`
                );

                console.log(
                    "================================="
                );

                // -------------------------------------------------
                // CREATE ENROLLMENT
                // -------------------------------------------------

                const result =
                    await apiRequest<Enrollment>(
                        "/Enrollments",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                courseId
                            })
                        }
                    );

                console.log(
                    "Enrollment response:",
                    result
                );

                // -------------------------------------------------
                // GET THE ACTUAL ENROLLMENT
                // -------------------------------------------------

                let enrollment =
                    result;

                try {

                    const refreshedEnrollment =
                        await getCourseEnrollment(
                            courseId
                        );

                    if (
                        refreshedEnrollment
                    ) {

                        enrollment =
                            refreshedEnrollment;
                    }

                } catch (refreshError) {

                    console.warn(
                        "Enrollment created, but refreshing enrollment failed:",
                        refreshError
                    );
                }

                // -------------------------------------------------
                // UPDATE STATE
                // -------------------------------------------------

                setLearningCourses(
                    previous =>
                        previous.map(
                            item => {

                                if (
                                    item.course.courseId !==
                                    courseId
                                ) {

                                    return item;
                                }

                                return {
                                    ...item,
                                    enrollment
                                };
                            }
                        )
                );

                // -------------------------------------------------
                // OPEN COURSE AFTER SUCCESS
                // -------------------------------------------------

                console.log(
                    "Enrollment successful."
                );

                console.log(
                    "Opening course:",
                    courseId
                );

                openCourse(
                    courseId
                );

            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "EPIC ENROLLMENT ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "================================="
                );

                setEnrollError(
                    error instanceof Error
                        ? error.message
                        : "Unable to enroll in this course."
                );

            } finally {

                setEnrollingCourseId(
                    null
                );
            }

        },
        [
            apiRequest,
            enrollingCourseId,
            getCourseEnrollment,
            openCourse
        ]
    );

    // =====================================================
    // COURSE ACTION
    // =====================================================

    const handleCourseAction = useCallback(
        (
            course: Course,
            enrollment: Enrollment | null
        ) => {

            console.log(
                "EPIC COURSE ACTION:",
                {
                    courseId: course.courseId,
                    title: course.title,
                    enrolled: Boolean(enrollment)
                }
            );

            // -------------------------------------------------
            // ALREADY ENROLLED
            // -------------------------------------------------

            if (enrollment) {

                openCourse(
                    course.courseId
                );

                return;
            }

            // -------------------------------------------------
            // NOT ENROLLED
            // -------------------------------------------------

            enrollInCourse(
                course.courseId
            );

        },
        [
            openCourse,
            enrollInCourse
        ]
    );

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh =
        useCallback(() => {

            loadLearningData();

        }, [loadLearningData]);

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="lms-loading">

                <div className="lms-loading-spinner" />

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

            <div className="lms-error">

                <div className="lms-error-icon">
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
                    onClick={handleRefresh}
                >
                    Try Again
                </button>

            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="epic-learning-home">

            {/* =================================================
                HEADER
            ================================================= */}

            <section className="lms-page-header">

                <div className="lms-page-title-row">

                    <div className="lms-page-icon">
                        📖
                    </div>

                    <div>

                        <h1>
                            EPIC Learning
                        </h1>

                        <p>
                            Grow in faith, knowledge,
                            and Christian discipleship.
                        </p>

                    </div>

                </div>

                <div className="lms-user-summary">

                    <div className="lms-avatar">

                        {currentUser
                            .charAt(0)
                            .toUpperCase()}

                    </div>

                    <div>

                        <strong>
                            {currentUser}
                        </strong>

                        <span>
                            {currentRole}
                        </span>

                    </div>

                </div>

            </section>

            {/* =================================================
                HERO
            ================================================= */}

            <section className="lms-hero">

                <div className="lms-hero-content">

                    <span className="lms-hero-eyebrow">
                        EPIC LEARNING
                    </span>

                    <h1>
                        Grow in Faith.
                        <br />
                        Learn. Serve.
                        <br />
                        Lead.
                    </h1>

                    <p>
                        Continue your journey of faith
                        and deepen your understanding
                        of God's Word.
                    </p>

                    <button
                        type="button"
                        className="lms-hero-button"
                        onClick={openLibrary}
                    >

                        <span>
                            ◇
                        </span>

                        Explore Courses

                        <span>
                            →
                        </span>

                    </button>

                </div>

                <div className="lms-hero-visual">

                    <div className="lms-hero-book">
                        📖
                    </div>

                    <strong>
                        EPIC LEARNING
                    </strong>

                    <span>
                        Learn • Grow • Serve
                    </span>

                </div>

            </section>

            {/* =================================================
                ENROLLMENT ERROR
            ================================================= */}

            {enrollError && (

                <div
                    className="lms-enrollment-error"
                    role="alert"
                >

                    <strong>
                        Enrollment failed
                    </strong>

                    <span>
                        {enrollError}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setEnrollError(null)
                        }
                        aria-label="Close enrollment error"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="lms-summary-grid">

                <div className="lms-summary-card">

                    <div className="lms-summary-icon blue">
                        📚
                    </div>

                    <div>

                        <span>
                            Enrolled Courses
                        </span>

                        <strong>
                            {enrolledCourses.length}
                        </strong>

                    </div>

                </div>

                <div className="lms-summary-card">

                    <div className="lms-summary-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedCourses.length}
                        </strong>

                    </div>

                </div>

                <div className="lms-summary-card">

                    <div className="lms-summary-icon gold">
                        %
                    </div>

                    <div>

                        <span>
                            Overall Progress
                        </span>

                        <strong>
                            {overallProgress}%
                        </strong>

                    </div>

                </div>

                <div className="lms-summary-card">

                    <div className="lms-summary-icon purple">
                        ◷
                    </div>

                    <div>

                        <span>
                            Last Activity
                        </span>

                        <strong className="lms-summary-date">

                            {lastActive
                                ? formatDate(
                                    lastActive.enrollment
                                        ?.enrolledDate
                                )
                                : "—"}

                        </strong>

                    </div>

                </div>

            </section>

            {/* =================================================
                MY LEARNING
            ================================================= */}

            <section className="lms-section">

                <div className="lms-section-header">

                    <div>

                        <h2>
                            My Learning
                        </h2>

                        <p>
                            Continue where you left off.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="lms-text-button"
                        onClick={openLibrary}
                    >
                        View All Courses
                        <span>
                            →
                        </span>
                    </button>

                </div>

                {continueCourse ? (

                    <div className="lms-continue-card">

                        <div className="lms-continue-thumbnail">

                            {getThumbnail(
                                continueCourse.course
                            ) ? (

                                <img
                                    src={
                                        getThumbnail(
                                            continueCourse.course
                                        ) || ""
                                    }
                                    alt={
                                        continueCourse.course.title
                                    }
                                />

                            ) : (

                                <div>
                                    📖
                                </div>
                            )}

                        </div>

                        <div className="lms-continue-content">

                            <span className="lms-card-label">

                                {continueCourse.enrollment
                                    ?.isCompleted
                                    ? "COMPLETED COURSE"
                                    : "CONTINUE LEARNING"}

                            </span>

                            <h3>
                                {continueCourse.course.title}
                            </h3>

                            <p>

                                {
                                    continueCourse.course
                                        .shortDescription ||
                                    continueCourse.course
                                        .description ||
                                    "Continue learning and growing in faith."
                                }

                            </p>

                            <div className="lms-progress-row">

                                <div className="lms-progress">

                                    <div
                                        style={{
                                            width:
                                                `${clampProgress(
                                                    continueCourse
                                                        .enrollment
                                                        ?.progressPercentage
                                                )}%`
                                        }}
                                    />

                                </div>

                                <strong>

                                    {
                                        clampProgress(
                                            continueCourse
                                                .enrollment
                                                ?.progressPercentage
                                        )
                                    }%

                                </strong>

                            </div>

                            <div className="lms-continue-footer">

                                <span>

                                    {getLessonCount(
                                        continueCourse.course,
                                        continueCourse.enrollment
                                    )} Lessons

                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCourseAction(
                                            continueCourse.course,
                                            continueCourse.enrollment
                                        )
                                    }
                                >

                                    {continueCourse.enrollment
                                        ?.isCompleted
                                        ? "View Course"
                                        : "Continue Learning"}

                                </button>

                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="lms-empty">

                        <div className="lms-empty-icon">
                            📚
                        </div>

                        <h3>
                            You have no enrolled courses
                        </h3>

                        <p>
                            Choose a course below to begin
                            your learning journey.
                        </p>

                        <button
                            type="button"
                            onClick={openLibrary}
                        >
                            Browse Courses
                        </button>

                    </div>
                )}

            </section>

            {/* =================================================
                MY COURSES
            ================================================= */}

            {enrolledCourses.length > 0 && (

                <section className="lms-section">

                    <div className="lms-section-header">

                        <div>

                            <h2>
                                My Courses
                            </h2>

                            <p>
                                Courses you are currently
                                enrolled in.
                            </p>

                        </div>

                    </div>

                    <div className="lms-course-grid">

                        {enrolledCourses.map(
                            ({
                                course,
                                enrollment
                            }) => {

                                const progress =
                                    clampProgress(
                                        enrollment
                                            ?.progressPercentage
                                    );

                                const completed =
                                    enrollment
                                        ?.isCompleted === true;

                                return (

                                    <article
                                        className="lms-course-card"
                                        key={`my-course-${course.courseId}`}
                                    >

                                        <div className="lms-course-image">

                                            {getThumbnail(
                                                course
                                            ) ? (

                                                <img
                                                    src={
                                                        getThumbnail(
                                                            course
                                                        ) || ""
                                                    }
                                                    alt={
                                                        course.title
                                                    }
                                                />

                                            ) : (

                                                <div className="lms-course-placeholder">
                                                    📖
                                                </div>
                                            )}

                                            <span
                                                className={
                                                    completed
                                                        ? "completed"
                                                        : ""
                                                }
                                            >

                                                {completed
                                                    ? "Completed"
                                                    : "In Progress"}

                                            </span>

                                        </div>

                                        <div className="lms-course-body">

                                            <h3>
                                                {course.title}
                                            </h3>

                                            <p>

                                                {
                                                    course.shortDescription ||
                                                    course.description ||
                                                    "Continue learning and growing in faith."
                                                }

                                            </p>

                                            <div className="lms-progress-row">

                                                <div className="lms-progress">

                                                    <div
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

                                            <div className="lms-course-footer">

                                                <span>

                                                    {getLessonCount(
                                                        course,
                                                        enrollment
                                                    )} Lessons

                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openCourse(
                                                            course.courseId
                                                        )
                                                    }
                                                >

                                                    {completed
                                                        ? "View Course"
                                                        : "Continue"}

                                                </button>

                                            </div>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>

                </section>
            )}

            {/* =================================================
                COURSE LIBRARY
            ================================================= */}

            <section
                id="lms-course-library"
                className="lms-section"
            >

                <div className="lms-section-header">

                    <div>

                        <h2>
                            Learning Library
                        </h2>

                        <p>
                            Browse courses available
                            in EPIC Learning.
                        </p>

                    </div>

                </div>

                {courses.length === 0 ? (

                    <div className="lms-empty">

                        <div className="lms-empty-icon">
                            📚
                        </div>

                        <h3>
                            No courses available
                        </h3>

                        <p>
                            There are currently no
                            published courses.
                        </p>

                    </div>

                ) : (

                    <div className="lms-library-grid">

                        {courses.map(
                            course => {

                                const learningCourse =
                                    learningCourses.find(
                                        item =>
                                            item.course.courseId ===
                                            course.courseId
                                    );

                                const enrollment =
                                    learningCourse?.enrollment ||
                                    null;

                                const enrolled =
                                    enrollment !== null;

                                const completed =
                                    enrollment
                                        ?.isCompleted === true;

                                const progress =
                                    clampProgress(
                                        enrollment
                                            ?.progressPercentage
                                    );

                                const isEnrolling =
                                    enrollingCourseId ===
                                    course.courseId;

                                const lessonCount =
                                    getLessonCount(
                                        course,
                                        enrollment
                                    );

                                const duration =
                                    course.durationMinutes ??
                                    course.estimatedMinutes;

                                return (

                                    <article
                                        className="lms-library-card"
                                        key={`library-course-${course.courseId}`}
                                    >

                                        {/* THUMBNAIL */}

                                        <div className="lms-library-icon">

                                            {getThumbnail(
                                                course
                                            ) ? (

                                                <img
                                                    src={
                                                        getThumbnail(
                                                            course
                                                        ) || ""
                                                    }
                                                    alt={
                                                        course.title
                                                    }
                                                />

                                            ) : (

                                                <span>
                                                    📖
                                                </span>
                                            )}

                                        </div>

                                        {/* CONTENT */}

                                        <div className="lms-library-content">

                                            <span>
                                                EPIC LEARNING
                                            </span>

                                            <h3>
                                                {course.title}
                                            </h3>

                                            <p>

                                                {
                                                    course.shortDescription ||
                                                    course.description ||
                                                    "Grow in faith and develop biblical understanding."
                                                }

                                            </p>

                                            <div className="lms-library-meta">

                                                <span>
                                                    {lessonCount} Lessons
                                                </span>

                                                {duration ? (

                                                    <span>
                                                        {duration} min
                                                    </span>

                                                ) : null}

                                                {course.level ? (

                                                    <span>
                                                        {course.level}
                                                    </span>

                                                ) : null}

                                            </div>

                                            {/* PROGRESS */}

                                            {enrolled && (

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "12px"
                                                    }}
                                                >

                                                    <div className="lms-progress-row">

                                                        <div className="lms-progress">

                                                            <div
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

                                                </div>
                                            )}

                                        </div>

                                        {/* ACTION */}

                                        <button
                                            type="button"
                                            className={
                                                enrolled
                                                    ? "lms-course-action enrolled"
                                                    : "lms-course-action enroll"
                                            }
                                            disabled={
                                                isEnrolling
                                            }
                                            onClick={() =>
                                                handleCourseAction(
                                                    course,
                                                    enrollment
                                                )
                                            }
                                        >

                                            {isEnrolling
                                                ? "Enrolling..."
                                                : enrolled
                                                    ? completed
                                                        ? "✓ Completed"
                                                        : "Open Course →"
                                                    : "Enroll Now →"}

                                        </button>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

        </div>
    );
};

export default EPICLearningHome;