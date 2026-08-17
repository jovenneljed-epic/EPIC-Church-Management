import React, { useEffect, useState } from "react";
import "./LessonViewer.css";

// =========================================================
// API
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

// =========================================================
// TYPES
// =========================================================

interface LessonData {
    lessonId: number;
    courseId: number;
    courseTitle?: string | null;

    title: string;
    content?: string | null;

    videoUrl?: string | null;
    resourceUrl?: string | null;

    estimatedMinutes?: number;
    isFreePreview?: boolean;

    lessonProgressId?: number;
    courseEnrollmentId?: number;

    progressPercentage: number;
    isCompleted: boolean;

    startedDate?: string | null;
    completedDate?: string | null;
}

interface CompleteResponse {
    message?: string;

    lessonProgress?: {
        lessonProgressId?: number;
        courseEnrollmentId?: number;
        lessonId?: number;

        progressPercentage?: number;
        isCompleted?: boolean;

        startedDate?: string | null;
        completedDate?: string | null;
    };

    courseProgress?: {
        courseEnrollmentId?: number;
        courseId?: number;

        progressPercentage?: number;
        isCompleted?: boolean;

        completedDate?: string | null;
    };
}

interface LessonViewerProps {
    lessonId: number;
    courseId: number;

    onBack: () => void;

    onPrevious?: () => void;
    onNext?: () => void;

    hasPrevious?: boolean;
    hasNext?: boolean;

    onProgressUpdated?: (
        lessonId: number
    ) => void;
}

// =========================================================
// COMPONENT
// =========================================================

const LessonViewer: React.FC<LessonViewerProps> = ({
    lessonId,
    courseId,
    onBack,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
    onProgressUpdated,
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [lesson, setLesson] =
        useState<LessonData | null>(null);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [error, setError] =
        useState<string>("");

    const [completing, setCompleting] =
        useState<boolean>(false);

    const [completeMessage, setCompleteMessage] =
        useState<string>("");

    const [completeError, setCompleteError] =
        useState<string>("");

    // =====================================================
    // TOKEN
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
    // HEADERS
    // =====================================================

    const getHeaders = (): HeadersInit => {

        const token = getToken();

        return {
            Authorization: token
                ? `Bearer ${token}`
                : "",

            Accept: "application/json",

            "Content-Type":
                "application/json",
        };
    };

    // =====================================================
    // NORMALIZE LESSON
    // =====================================================

    const normalizeLesson = (
        data: LessonData
    ): LessonData => {

        const rawProgress =
            Number(
                data.progressPercentage ?? 0
            );

        const progressPercentage =
            Number.isFinite(rawProgress)
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        rawProgress
                    )
                )
                : 0;

        return {

            ...data,

            lessonId:
                Number(
                    data.lessonId
                ),

            courseId:
                Number(
                    data.courseId ||
                    courseId
                ),

            title:
                data.title?.trim() ||
                "Untitled Lesson",

            progressPercentage,

            isCompleted:
                data.isCompleted === true,

            isFreePreview:
                data.isFreePreview === true,

            estimatedMinutes:
                Number(
                    data.estimatedMinutes ?? 0
                ),

            startedDate:
                data.startedDate ??
                null,

            completedDate:
                data.completedDate ??
                null,
        };
    };

    // =====================================================
    // LOAD LESSON
    // =====================================================

    useEffect(() => {

        let cancelled = false;

        const loadLesson = async () => {

            try {

                setLoading(true);
                setError("");
                setCompleteError("");
                setCompleteMessage("");
                setLesson(null);

                const token =
                    getToken();

                if (!token) {

                    throw new Error(
                        "Authentication token not found."
                    );
                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC LESSON VIEWER"
                );

                console.log(
                    "Course ID:",
                    courseId
                );

                console.log(
                    "Lesson ID:",
                    lessonId
                );

                console.log(
                    "================================="
                );

                const response =
                    await fetch(
                        `${API_BASE_URL}/LessonProgress/lesson/${lessonId}`,
                        {
                            method: "GET",
                            headers: getHeaders(),
                        }
                    );

                console.log(
                    "Lesson response:",
                    response.status
                );

                if (!response.ok) {

                    let message =
                        `Failed to load lesson. Status: ${response.status}`;

                    try {

                        const errorData =
                            await response.json();

                        if (
                            typeof errorData?.message ===
                            "string" &&
                            errorData.message.trim()
                        ) {

                            message =
                                errorData.message;
                        }

                    } catch {
                        // Ignore invalid JSON
                    }

                    throw new Error(
                        message
                    );
                }

                const data =
                    (await response.json()) as LessonData;

                console.log(
                    "EPIC LESSON DATA:",
                    data
                );

                const normalizedLesson =
                    normalizeLesson(data);

                console.log(
                    "NORMALIZED LESSON:",
                    normalizedLesson
                );

                console.log(
                    "Lesson completed:",
                    normalizedLesson.isCompleted
                );

                if (!cancelled) {

                    setLesson(
                        normalizedLesson
                    );
                }

            } catch (err) {

                console.error(
                    "Error loading lesson:",
                    err
                );

                if (!cancelled) {

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load lesson."
                    );
                }

            } finally {

                if (!cancelled) {

                    setLoading(false);
                }
            }
        };

        loadLesson();

        return () => {

            cancelled = true;
        };

    }, [lessonId, courseId]);

    // =====================================================
    // COMPLETE LESSON
    // =====================================================

    const handleCompleteLesson =
        async () => {

            if (!lesson) {
                return;
            }

            if (
                lesson.isCompleted === true
            ) {
                return;
            }

            try {

                setCompleting(true);
                setCompleteError("");
                setCompleteMessage("");

                const token =
                    getToken();

                if (!token) {

                    throw new Error(
                        "Authentication token not found."
                    );
                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC COMPLETE LESSON"
                );

                console.log(
                    "Lesson ID:",
                    lesson.lessonId
                );

                console.log(
                    "================================="
                );

                const response =
                    await fetch(
                        `${API_BASE_URL}/LessonProgress/complete/${lesson.lessonId}`,
                        {
                            method: "POST",
                            headers: getHeaders(),
                        }
                    );

                console.log(
                    "Complete response:",
                    response.status
                );

                if (!response.ok) {

                    let message =
                        `Unable to complete lesson. Status: ${response.status}`;

                    try {

                        const errorData =
                            await response.json();

                        if (
                            typeof errorData?.message ===
                            "string" &&
                            errorData.message.trim()
                        ) {

                            message =
                                errorData.message;
                        }

                    } catch {
                        // Ignore invalid JSON
                    }

                    throw new Error(
                        message
                    );
                }

                const data =
                    (await response.json()) as CompleteResponse;

                console.log(
                    "LESSON COMPLETION RESPONSE:",
                    data
                );

                const apiProgress =
                    data.lessonProgress;

                const rawProgress =
                    Number(
                        apiProgress?.progressPercentage ??
                        100
                    );

                const progressPercentage =
                    Number.isFinite(rawProgress)
                        ? Math.min(
                            100,
                            Math.max(
                                0,
                                rawProgress
                            )
                        )
                        : 100;

                const lessonProgressId =
                    apiProgress?.lessonProgressId ??
                    lesson.lessonProgressId;

                const courseEnrollmentId =
                    apiProgress?.courseEnrollmentId ??
                    lesson.courseEnrollmentId;

                const completedLessonId =
                    apiProgress?.lessonId ??
                    lesson.lessonId;

                const startedDate =
                    apiProgress?.startedDate ??
                    lesson.startedDate ??
                    null;

                const completedDate =
                    apiProgress?.completedDate ??
                    new Date().toISOString();

                // =================================================
                // UPDATE LESSON
                // =================================================

                setLesson(previous => {

                    if (!previous) {
                        return null;
                    }

                    const updatedLesson: LessonData = {

                        ...previous,

                        lessonProgressId:
                            lessonProgressId,

                        courseEnrollmentId:
                            courseEnrollmentId,

                        progressPercentage:
                            progressPercentage,

                        isCompleted:
                            true,

                        startedDate:
                            startedDate,

                        completedDate:
                            completedDate,
                    };

                    return updatedLesson;
                });

                // =================================================
                // SUCCESS MESSAGE
                // =================================================

                setCompleteMessage(
                    "Lesson completed successfully!"
                );

                // =================================================
                // NOTIFY PARENT
                // =================================================

                onProgressUpdated?.(
                    completedLessonId
                );

                console.log(
                    "Lesson successfully completed."
                );

            } catch (err) {

                console.error(
                    "Error completing lesson:",
                    err
                );

                setCompleteError(
                    err instanceof Error
                        ? err.message
                        : "Unable to complete lesson."
                );

            } finally {

                setCompleting(false);
            }
        };

    // =====================================================
    // YOUTUBE EMBED
    // =====================================================

    const getYouTubeEmbedUrl = (
        url?: string | null
    ): string | null => {

        if (!url) {
            return null;
        }

        const trimmed =
            url.trim();

        if (!trimmed) {
            return null;
        }

        try {

            const parsed =
                new URL(trimmed);

            const hostname =
                parsed.hostname.toLowerCase();

            if (
                hostname === "youtube.com" ||
                hostname === "www.youtube.com" ||
                hostname.endsWith(".youtube.com")
            ) {

                const videoId =
                    parsed.searchParams.get("v");

                if (videoId) {

                    return (
                        `https://www.youtube.com/embed/${videoId}`
                    );
                }

                if (
                    parsed.pathname.startsWith(
                        "/embed/"
                    )
                ) {

                    return trimmed;
                }
            }

            if (
                hostname === "youtu.be" ||
                hostname.endsWith(".youtu.be")
            ) {

                const videoId =
                    parsed.pathname
                        .replace(
                            /^\/+/,
                            ""
                        )
                        .split("/")[0]
                        .trim();

                if (videoId) {

                    return (
                        `https://www.youtube.com/embed/${videoId}`
                    );
                }
            }

            return null;

        } catch {

            return null;
        }
    };

    // =====================================================
    // RESOURCE URL
    // =====================================================

    const buildResourceUrl = (
        resourceUrl?: string | null
    ): string | null => {

        if (!resourceUrl) {
            return null;
        }

        const trimmed =
            resourceUrl.trim();

        if (!trimmed) {
            return null;
        }

        if (
            trimmed.startsWith("http://") ||
            trimmed.startsWith("https://")
        ) {

            return trimmed;
        }

        const apiRoot =
            API_BASE_URL.replace(
                /\/api\/?$/,
                ""
            );

        const cleanPath =
            trimmed.startsWith("/")
                ? trimmed
                : `/${trimmed}`;

        return (
            `${apiRoot}${cleanPath}`
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="lesson-viewer-loading">

                <div className="lesson-viewer-spinner" />

                <h2>
                    Loading Lesson...
                </h2>

                <p>
                    Preparing your lesson.
                </p>

            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="lesson-viewer-error">

                <div className="lesson-viewer-error-icon">
                    !
                </div>

                <h2>
                    Unable to Load Lesson
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

    // =====================================================
    // NO LESSON
    // =====================================================

    if (!lesson) {

        return (

            <div className="lesson-viewer-error">

                <h2>
                    Lesson Not Found
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

    // =====================================================
    // URLS
    // =====================================================

    const videoEmbedUrl =
        getYouTubeEmbedUrl(
            lesson.videoUrl
        );

    const resourceUrl =
        buildResourceUrl(
            lesson.resourceUrl
        );

    // =====================================================
    // COMPLETION
    // =====================================================

    const isCompleted =
        lesson.isCompleted;

    // =====================================================
    // NAVIGATION
    // =====================================================

    const canGoNext =
        isCompleted &&
        hasNext &&
        typeof onNext === "function";

    const canGoPrevious =
        hasPrevious &&
        typeof onPrevious === "function";

    // =====================================================
    // VIEW
    // =====================================================

    return (

        <div className="lesson-viewer">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="lesson-viewer-topbar">

                <button
                    type="button"
                    className="lesson-viewer-back"
                    onClick={onBack}
                >
                    ← Back to Course
                </button>

                <span>
                    EPIC LEARNING
                </span>

            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <section className="lesson-viewer-header">

                {lesson.courseTitle && (

                    <div className="lesson-viewer-course">

                        {lesson.courseTitle}

                    </div>
                )}

                <h1>
                    {lesson.title}
                </h1>

                <div className="lesson-viewer-meta">

                    {typeof lesson.estimatedMinutes ===
                        "number" && (

                            <span>

                                ⏱{" "}
                                {lesson.estimatedMinutes}{" "}
                                min

                            </span>
                        )}

                    {lesson.isFreePreview && (

                        <span className="lesson-viewer-preview">

                            Preview Lesson

                        </span>
                    )}

                    {isCompleted && (

                        <span className="lesson-completed-badge">

                            ✓ Completed

                        </span>
                    )}

                </div>

            </section>

            {/* =================================================
                VIDEO
            ================================================= */}

            <section className="lesson-video-section">

                {videoEmbedUrl ? (

                    <>

                        <div className="lesson-video-header">

                            <div className="lesson-video-icon">
                                ▶
                            </div>

                            <div>

                                <h2>
                                    Lesson Video
                                </h2>

                                <p>
                                    Watch the lesson before continuing.
                                </p>

                            </div>

                        </div>

                        <div className="lesson-video-wrapper">

                            <iframe
                                src={videoEmbedUrl}
                                title={lesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />

                        </div>

                    </>

                ) : (

                    <div className="lesson-no-video">

                        <div className="lesson-no-video-icon">
                            ▶
                        </div>

                        <h3>
                            No Video Available
                        </h3>

                        <p>
                            This lesson does not have a video yet.
                        </p>

                    </div>
                )}

            </section>

            {/* =================================================
                CONTENT
            ================================================= */}

            {lesson.content && (

                <section className="lesson-content-section">

                    <div className="lesson-content-header">

                        <span>
                            LESSON
                        </span>

                        <h2>
                            {lesson.title}
                        </h2>

                    </div>

                    <div
                        className="lesson-content-body"
                        dangerouslySetInnerHTML={{
                            __html:
                                lesson.content
                        }}
                    />

                </section>
            )}

            {/* =================================================
                RESOURCE
            ================================================= */}

            {resourceUrl && (

                <section className="lesson-resource-section">

                    <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lesson-resource-button"
                    >
                        📎 Open Lesson Resource
                    </a>

                </section>
            )}

            {/* =================================================
                COMPLETION
            ================================================= */}

            <section className="lesson-completion-section">

                {!isCompleted ? (

                    <>

                        <div className="lesson-completion-card">

                            <div className="lesson-completion-icon">
                                ✓
                            </div>

                            <div className="lesson-completion-content">

                                <h3>
                                    Finished this lesson?
                                </h3>

                                <p>
                                    Mark this lesson as complete to unlock the next lesson.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="lesson-complete-button"
                                onClick={
                                    handleCompleteLesson
                                }
                                disabled={
                                    completing
                                }
                            >

                                {completing
                                    ? "Completing..."
                                    : "✓ Mark Lesson Complete"}

                            </button>

                        </div>

                        {completeError && (

                            <div className="lesson-completion-error">

                                {completeError}

                            </div>
                        )}

                    </>

                ) : (

                    <div className="lesson-completed-card">

                        <div className="lesson-completed-icon">
                            ✓
                        </div>

                        <div>

                            <h3>
                                Lesson Completed
                            </h3>

                            <p>
                                Great job! You can now continue to the next lesson.
                            </p>

                        </div>

                    </div>
                )}

                {completeMessage && (

                    <div className="lesson-completion-success">

                        ✓{" "}
                        {completeMessage}

                    </div>
                )}

            </section>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="lesson-viewer-navigation">

                {/* PREVIOUS */}

                <button
                    type="button"
                    className="lesson-nav-button lesson-nav-back"
                    onClick={
                        canGoPrevious
                            ? onPrevious
                            : undefined
                    }
                    disabled={
                        !canGoPrevious
                    }
                >

                    <span className="lesson-nav-arrow">
                        ←
                    </span>

                    <span>

                        <small>
                            Previous
                        </small>

                        <strong>
                            Previous Lesson
                        </strong>

                    </span>

                </button>

                {/* COURSE */}

                <button
                    type="button"
                    className="lesson-nav-course"
                    onClick={onBack}
                >
                    ← Back to Course
                </button>

                {/* NEXT */}

                <button
                    type="button"
                    className="lesson-nav-button lesson-nav-next"
                    onClick={
                        canGoNext
                            ? onNext
                            : undefined
                    }
                    disabled={
                        !canGoNext
                    }
                    aria-disabled={
                        !canGoNext
                    }
                >

                    <span>

                        <small>
                            Next
                        </small>

                        <strong>

                            {canGoNext
                                ? "Next Lesson"
                                : "Complete Lesson First"}

                        </strong>

                    </span>

                    <span className="lesson-nav-arrow">

                        {canGoNext
                            ? "→"
                            : "🔒"}

                    </span>

                </button>

            </div>

            {/* =================================================
                LOCK MESSAGE
            ================================================= */}

            {!isCompleted &&
                hasNext && (

                    <div className="lesson-next-locked-message">

                        <span>
                            🔒
                        </span>

                        <div>

                            <strong>
                                Next Lesson Locked
                            </strong>

                            <p>
                                Complete this lesson to unlock the next lesson.
                            </p>

                        </div>

                    </div>
                )}

        </div>
    );
};

export default LessonViewer;