import React, { useEffect, useState } from "react";
import "./LessonPage.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5109/api";

// =========================================================
// TYPES
// =========================================================

interface LessonData {
    lessonId: number;
    title: string;
    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    estimatedMinutes: number;
    isFreePreview: boolean;

    progressPercentage: number;
    isCompleted: boolean;

    startedDate?: string | null;
    completedDate?: string | null;

    courseId?: number;
    courseModuleId?: number;
    moduleTitle?: string;
}

interface NavigationLesson {
    lessonId: number;
    title: string;
    estimatedMinutes: number;
    isCompleted: boolean;
}

interface LessonPageProps {
    lessonId: number;
    onBack: () => void;
    onLessonSelect?: (lessonId: number) => void;
}

// =========================================================
// COMPONENT
// =========================================================

const LessonPage: React.FC<LessonPageProps> = ({
    lessonId,
    onBack,
    onLessonSelect
}) => {

    const [lesson, setLesson] =
        useState<LessonData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [completing, setCompleting] =
        useState(false);

    const [navigationLessons, setNavigationLessons] =
        useState<NavigationLesson[]>([]);

    const [navigationLoading, setNavigationLoading] =
        useState(true);

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () =>
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken");

    // =========================================================
    // LOAD LESSON
    // =========================================================

    useEffect(() => {

        if (!lessonId) {
            setError("Invalid lesson.");
            setLoading(false);
            return;
        }

        loadLesson();

    }, [lessonId]);

    // =========================================================
    // LOAD LESSON
    // =========================================================

    const loadLesson = async () => {

        try {

            setLoading(true);
            setError("");
            setNavigationLoading(true);

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            console.log(
                "Loading lesson:",
                lessonId
            );

            const response = await fetch(
                `${API_BASE_URL}/LessonProgress/lesson/${lessonId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            "application/json"
                    }
                }
            );

            console.log(
                "Lesson response status:",
                response.status
            );

            if (!response.ok) {

                let message =
                    `Unable to load lesson. Status: ${response.status}`;

                try {

                    const errorData =
                        await response.json();

                    if (errorData?.message) {
                        message =
                            errorData.message;
                    }

                } catch {
                    // Ignore invalid JSON
                }

                throw new Error(message);
            }

            const data =
                await response.json();

            console.log(
                "========== LESSON API RESPONSE =========="
            );

            console.log(data);

            console.log(
                "=========================================="
            );

            if (!data || !data.lessonId) {

                throw new Error(
                    "Lesson content could not be found."
                );
            }

            const loadedLesson: LessonData = {

                lessonId:
                    data.lessonId,

                title:
                    data.title ||
                    "Untitled Lesson",

                content:
                    data.content ??
                    null,

                videoUrl:
                    data.videoUrl ??
                    null,

                resourceUrl:
                    data.resourceUrl ??
                    null,

                estimatedMinutes:
                    data.estimatedMinutes ??
                    0,

                isFreePreview:
                    data.isFreePreview ??
                    false,

                progressPercentage:
                    data.progressPercentage ??
                    0,

                isCompleted:
                    data.isCompleted ??
                    false,

                startedDate:
                    data.startedDate ??
                    null,

                completedDate:
                    data.completedDate ??
                    null,

                courseId:
                    data.courseId,

                courseModuleId:
                    data.courseModuleId,

                moduleTitle:
                    data.moduleTitle
            };

            setLesson(
                loadedLesson
            );

            // =====================================================
            // LOAD COURSE NAVIGATION
            // =====================================================

            if (data.courseId) {

                await loadNavigation(
                    data.courseId
                );

            } else {

                setNavigationLoading(false);

            }

        } catch (err) {

            console.error(
                "Lesson loading error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load lesson."
            );

            setNavigationLoading(false);

        } finally {

            setLoading(false);
        }
    };

    // =========================================================
    // LOAD COURSE NAVIGATION
    // =========================================================

    const loadNavigation = async (
        courseId: number
    ) => {

        try {

            setNavigationLoading(true);

            const token = getToken();

            if (!token) {
                setNavigationLessons([]);
                return;
            }

            console.log(
                "Loading course navigation:",
                courseId
            );

            const response = await fetch(
                `${API_BASE_URL}/LessonProgress/course/${courseId}`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            "application/json"
                    }
                }
            );

            console.log(
                "Course navigation status:",
                response.status
            );

            if (!response.ok) {

                console.error(
                    "Unable to load course navigation."
                );

                setNavigationLessons([]);

                return;
            }

            const data =
                await response.json();

            const lessons: NavigationLesson[] = [];

            // =====================================================
            // FLATTEN MODULES INTO ORDERED LESSON LIST
            // =====================================================

            if (
                Array.isArray(data.modules)
            ) {

                const sortedModules =
                    [...data.modules].sort(
                        (
                            a: any,
                            b: any
                        ) =>
                            (a.sortOrder ?? 0) -
                            (b.sortOrder ?? 0)
                    );

                sortedModules.forEach(
                    (module: any) => {

                        if (
                            !Array.isArray(
                                module.lessons
                            )
                        ) {
                            return;
                        }

                        const sortedLessons =
                            [...module.lessons]
                                .sort(
                                    (
                                        a: any,
                                        b: any
                                    ) =>
                                        (a.sortOrder ?? 0) -
                                        (b.sortOrder ?? 0)
                                );

                        sortedLessons.forEach(
                            (item: any) => {

                                if (
                                    !item.lessonId
                                ) {
                                    return;
                                }

                                lessons.push({

                                    lessonId:
                                        item.lessonId,

                                    title:
                                        item.title ||
                                        "Untitled Lesson",

                                    estimatedMinutes:
                                        item.estimatedMinutes ??
                                        0,

                                    isCompleted:
                                        item.progress
                                            ?.isCompleted ===
                                        true
                                });

                            }
                        );

                    }
                );
            }

            console.log(
                "Navigation lessons:",
                lessons
            );

            setNavigationLessons(
                lessons
            );

        } catch (err) {

            console.error(
                "Navigation loading error:",
                err
            );

            setNavigationLessons([]);

        } finally {

            setNavigationLoading(false);
        }
    };

    // =========================================================
    // NAVIGATION CALCULATION
    // =========================================================

    const currentIndex =
        navigationLessons.findIndex(
            item =>
                item.lessonId === lessonId
        );

    const hasCurrentLesson =
        currentIndex >= 0;

    const isFirstLesson =
        hasCurrentLesson &&
        currentIndex === 0;

    const isLastLesson =
        hasCurrentLesson &&
        currentIndex ===
        navigationLessons.length - 1;

    const previousLesson =
        hasCurrentLesson &&
            currentIndex > 0
            ? navigationLessons[
                currentIndex - 1
            ]
            : null;

    const nextLesson =
        hasCurrentLesson &&
            currentIndex <
            navigationLessons.length - 1
            ? navigationLessons[
                currentIndex + 1
            ]
            : null;

    // =========================================================
    // CURRENT LESSON COMPLETION
    // =========================================================

    const currentLessonCompleted =
        lesson?.isCompleted === true;

    // =========================================================
    // COURSE COMPLETE
    // =========================================================

    const courseCompleted =
        navigationLessons.length > 0 &&
        navigationLessons.every(
            item =>
                item.isCompleted === true
        );

    // =========================================================
    // NEXT ENABLED
    // =========================================================

    const canGoNext =
        nextLesson !== null &&
        currentLessonCompleted;

    // =========================================================
    // OPEN LESSON
    // =========================================================

    const openLesson = (
        targetLessonId: number
    ) => {

        console.log(
            "Opening lesson:",
            targetLessonId
        );

        if (
            targetLessonId === lessonId
        ) {
            return;
        }

        if (onLessonSelect) {

            onLessonSelect(
                targetLessonId
            );

            return;
        }

        window.dispatchEvent(
            new CustomEvent(
                "epic-open-lesson",
                {
                    detail: {

                        lessonId:
                            targetLessonId,

                        courseId:
                            lesson?.courseId

                    }
                }
            )
        );
    };

    // =========================================================
    // START LESSON
    // =========================================================

    const startLesson = async () => {

        try {

            const token = getToken();

            if (!token) {

                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/LessonProgress/start/${lessonId}`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

            if (!response.ok) {

                throw new Error(
                    `Unable to start lesson. Status: ${response.status}`
                );
            }

            const data =
                await response.json();

            const progress =
                data.lessonProgress;

            setLesson(prev =>
                prev
                    ? {
                        ...prev,

                        progressPercentage:
                            progress?.progressPercentage ??
                            prev.progressPercentage,

                        isCompleted:
                            progress?.isCompleted ??
                            prev.isCompleted,

                        startedDate:
                            progress?.startedDate ??
                            prev.startedDate
                    }
                    : prev
            );

            // Refresh navigation

            if (lesson?.courseId) {

                await loadNavigation(
                    lesson.courseId
                );
            }

        } catch (err) {

            console.error(
                "Start lesson error:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to start lesson."
            );
        }
    };

    // =========================================================
    // COMPLETE LESSON
    // =========================================================

    const completeLesson = async () => {

        try {

            setCompleting(true);

            const token = getToken();

            if (!token) {

                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/LessonProgress/complete/${lessonId}`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

            if (!response.ok) {

                let message =
                    `Unable to complete lesson. Status: ${response.status}`;

                try {

                    const errorData =
                        await response.json();

                    if (errorData?.message) {

                        message =
                            errorData.message;
                    }

                } catch {
                    // Ignore invalid JSON
                }

                throw new Error(message);
            }

            const data =
                await response.json();

            console.log(
                "Lesson completed:",
                data
            );

            const progress =
                data.lessonProgress;

            setLesson(prev =>
                prev
                    ? {
                        ...prev,

                        progressPercentage:
                            progress?.progressPercentage ??
                            100,

                        isCompleted:
                            progress?.isCompleted ??
                            true,

                        startedDate:
                            progress?.startedDate ??
                            prev.startedDate,

                        completedDate:
                            progress?.completedDate ??
                            new Date().toISOString()
                    }
                    : prev
            );

            // =====================================================
            // REFRESH NAVIGATION
            // =====================================================

            if (lesson?.courseId) {

                await loadNavigation(
                    lesson.courseId
                );
            }

        } catch (err) {

            console.error(
                "Complete lesson error:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to complete lesson."
            );

        } finally {

            setCompleting(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="lesson-page-loading">

                <div className="lesson-loading-spinner" />

                <p>
                    Loading lesson...
                </p>

            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (
            <div className="lesson-page-error">

                <h2>
                    Unable to load lesson
                </h2>

                <p>
                    {error}
                </p>

                <button
                    type="button"
                    onClick={onBack}
                >
                    ← Back to Course
                </button>

            </div>
        );
    }

    // =========================================================
    // NO LESSON
    // =========================================================

    if (!lesson) {

        return (
            <div className="lesson-page-error">

                <h2>
                    Lesson not found
                </h2>

                <button
                    type="button"
                    onClick={onBack}
                >
                    ← Back to Course
                </button>

            </div>
        );
    }

    // =========================================================
    // LESSON PAGE
    // =========================================================

    return (

        <div className="lesson-page">

            {/* =================================================
                BACK
            ================================================= */}

            <button
                type="button"
                className="lesson-back-button"
                onClick={onBack}
            >
                ← Back to Course
            </button>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="lesson-header">

                <span className="lesson-eyebrow">
                    EPIC LEARNING
                </span>

                {lesson.moduleTitle && (

                    <span className="lesson-module">
                        {lesson.moduleTitle}
                    </span>

                )}

                <h1>
                    {lesson.title}
                </h1>

                <div className="lesson-header-meta">

                    <span>
                        ⏱ {lesson.estimatedMinutes} min
                    </span>

                    {lesson.isFreePreview && (

                        <span className="lesson-header-preview">
                            Preview Lesson
                        </span>

                    )}

                    {lesson.isCompleted && (

                        <span className="lesson-header-completed">
                            ✓ Completed
                        </span>

                    )}

                </div>

            </div>


            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="lesson-progress-card">

                <div className="lesson-progress-top">

                    <span>
                        Lesson Progress
                    </span>

                    <strong>
                        {lesson.progressPercentage}%
                    </strong>

                </div>

                <div className="lesson-progress-bar">

                    <div
                        style={{
                            width:
                                `${lesson.progressPercentage}%`
                        }}
                    />

                </div>

            </div>


            {/* =================================================
                VIDEO
            ================================================= */}

            {lesson.videoUrl && (

                <div className="lesson-video-card">

                    <div className="lesson-video-wrapper">

                        <iframe
                            src={lesson.videoUrl}
                            title={lesson.title}
                            allowFullScreen
                        />

                    </div>

                </div>

            )}


            {/* =================================================
                CONTENT
            ================================================= */}

            <article className="lesson-content-card">

                <div className="lesson-content-inner">

                    {lesson.content ? (

                        <div
                            className="lesson-content-text"
                            dangerouslySetInnerHTML={{
                                __html:
                                    lesson.content
                            }}
                        />

                    ) : (

                        <div className="lesson-empty-content">

                            <h3>
                                Lesson Content
                            </h3>

                            <p>
                                Content for this lesson
                                has not been added yet.
                            </p>

                        </div>

                    )}

                </div>

            </article>


            {/* =================================================
                RESOURCE
            ================================================= */}

            {lesson.resourceUrl && (

                <div className="lesson-resource-card">

                    <div>

                        <strong>
                            📎 Additional Resource
                        </strong>

                        <p>
                            Supporting material for
                            this lesson.
                        </p>

                    </div>

                    <a
                        href={lesson.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Resource →
                    </a>

                </div>

            )}


            {/* =================================================
                ACTION
            ================================================= */}

            <div className="lesson-action-card">

                {!lesson.startedDate &&
                    !lesson.isCompleted && (

                        <button
                            type="button"
                            className="lesson-start-button"
                            onClick={startLesson}
                        >
                            Start Lesson
                        </button>

                    )}

                {lesson.startedDate &&
                    !lesson.isCompleted && (

                        <button
                            type="button"
                            className="lesson-complete-button"
                            onClick={completeLesson}
                            disabled={completing}
                        >
                            {completing
                                ? "Completing..."
                                : "✓ Mark Lesson Complete"}
                        </button>

                    )}

                {lesson.isCompleted && (

                    <div className="lesson-completed-banner">

                        <span>
                            ✓
                        </span>

                        <div>

                            <strong>
                                Lesson Completed
                            </strong>

                            <p>
                                Great job! You have
                                completed this lesson.
                            </p>

                        </div>

                    </div>

                )}

            </div>


            {/* =================================================
                LESSON NAVIGATION
            ================================================= */}

            {!navigationLoading &&
                navigationLessons.length > 0 && (

                    <div className="lesson-navigation">

                        {/* =================================================
                            PREVIOUS
                        ================================================= */}

                        <button
                            type="button"
                            className="lesson-navigation-button previous"
                            onClick={() => {

                                if (previousLesson) {

                                    openLesson(
                                        previousLesson.lessonId
                                    );

                                }

                            }}
                            disabled={
                                !previousLesson
                            }
                        >

                            <span className="lesson-navigation-arrow">
                                ←
                            </span>

                            <span className="lesson-navigation-text">

                                <small>
                                    Previous Lesson
                                </small>

                                <strong>
                                    {previousLesson
                                        ? previousLesson.title
                                        : "Beginning of course"}
                                </strong>

                            </span>

                        </button>


                        {/* =================================================
                            POSITION
                        ================================================= */}

                        <div className="lesson-navigation-position">

                            <span>
                                Lesson
                            </span>

                            <strong>
                                {hasCurrentLesson
                                    ? currentIndex + 1
                                    : 1}
                            </strong>

                            <span>
                                of
                            </span>

                            <strong>
                                {navigationLessons.length}
                            </strong>

                        </div>


                        {/* =================================================
                            NEXT
                        ================================================= */}

                        <button
                            type="button"
                            className="lesson-navigation-button next"
                            onClick={() => {

                                if (
                                    nextLesson &&
                                    currentLessonCompleted
                                ) {

                                    openLesson(
                                        nextLesson.lessonId
                                    );

                                }

                            }}
                            disabled={
                                !canGoNext
                            }
                        >

                            <span className="lesson-navigation-text">

                                <small>
                                    Next Lesson
                                </small>

                                <strong>

                                    {!currentLessonCompleted
                                        ? "Complete this lesson first"
                                        : nextLesson
                                            ? nextLesson.title
                                            : "Course Complete"}

                                </strong>

                            </span>

                            <span className="lesson-navigation-arrow">
                                →
                            </span>

                        </button>


                        {/* =================================================
                            COURSE COMPLETE MESSAGE
                        ================================================= */}

                        {isLastLesson &&
                            lesson.isCompleted && (

                                <div className="lesson-course-complete">

                                    <div className="lesson-course-complete-icon">
                                        🎉
                                    </div>

                                    <div>

                                        <h3>
                                            Course Complete!
                                        </h3>

                                        <p>
                                            Congratulations! You have
                                            completed the final lesson
                                            of this course.
                                        </p>

                                    </div>

                                </div>

                            )}

                    </div>

                )}

        </div>
    );
};

export default LessonPage;