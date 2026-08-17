import React, { useEffect, useMemo, useState } from "react";
import "./LessonViewer.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

// =========================================================
// TYPES
// =========================================================

interface LessonProgress {
    progressPercentage: number;
    isCompleted: boolean;
    startedDate?: string | null;
    completedDate?: string | null;
}

interface LessonData {
    lessonId: number;
    title: string;
    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    sortOrder: number;
    estimatedMinutes: number;
    isFreePreview: boolean;
    progress?: LessonProgress | null;

    courseId?: number;
    courseTitle?: string | null;
}

// =========================================================
// PROPS
// =========================================================

interface LessonViewerProps {
    lessonId: number;
    courseId: number;
    onBack: () => void;
}

// =========================================================
// COMPONENT
// =========================================================

const LessonViewer: React.FC<LessonViewerProps> = ({
    lessonId,
    courseId,
    onBack
}) => {

    const [lesson, setLesson] =
        useState<LessonData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [videoLoading, setVideoLoading] =
        useState(true);

    const [videoError, setVideoError] =
        useState(false);

    const [completing, setCompleting] =
        useState(false);

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
    // API REQUEST
    // =====================================================

    const apiRequest = async (
        url: string,
        options: RequestInit = {}
    ) => {

        const token = getToken();

        if (!token) {
            throw new Error(
                "Authentication token not found."
            );
        }

        const response =
            await fetch(
                `${API_BASE_URL}${url}`,
                {
                    ...options,

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            "application/json",

                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    }
                }
            );

        if (!response.ok) {

            let message =
                `Request failed. Status: ${response.status}`;

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

        return response.json();
    };

    // =====================================================
    // LOAD LESSON
    // =====================================================

    useEffect(() => {

        if (!lessonId) {

            setError(
                "Invalid lesson."
            );

            setLoading(false);

            return;
        }

        loadLesson();

    }, [lessonId, courseId]);

    const loadLesson = async () => {

        try {

            setLoading(true);
            setError("");

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

            /*
             * We use the course lesson-progress endpoint
             * because your existing backend already returns
             * the lessons with their progress information.
             */

            const courseData =
                await apiRequest(
                    `/LessonProgress/course/${courseId}`
                );

            let foundLesson: LessonData | null =
                null;

            if (
                courseData?.modules &&
                Array.isArray(
                    courseData.modules
                )
            ) {

                for (
                    const module of courseData.modules
                ) {

                    if (
                        !module.lessons ||
                        !Array.isArray(
                            module.lessons
                        )
                    ) {
                        continue;
                    }

                    const match =
                        module.lessons.find(
                            (item: LessonData) =>
                                Number(
                                    item.lessonId
                                ) ===
                                Number(
                                    lessonId
                                )
                        );

                    if (match) {

                        foundLesson = {
                            ...match,

                            courseId:
                                courseData.courseId,

                            courseTitle:
                                courseData.courseTitle
                        };

                        break;
                    }
                }
            }

            if (!foundLesson) {

                throw new Error(
                    "Lesson not found."
                );
            }

            console.log(
                "EPIC LESSON DATA:",
                foundLesson
            );

            setLesson(
                foundLesson
            );

        }
        catch (err) {

            console.error(
                "Error loading lesson:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load lesson."
            );

        }
        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // VIDEO URL
    // =====================================================

    const videoUrl =
        lesson?.videoUrl?.trim() || "";

    // =====================================================
    // YOUTUBE DETECTION
    // =====================================================

    const youtubeId =
        useMemo(() => {

            if (!videoUrl) {
                return null;
            }

            try {

                const url =
                    new URL(videoUrl);

                if (
                    url.hostname.includes(
                        "youtube.com"
                    )
                ) {

                    return (
                        url.searchParams.get(
                            "v"
                        )
                    );
                }

                if (
                    url.hostname.includes(
                        "youtu.be"
                    )
                ) {

                    return (
                        url.pathname
                            .replace(
                                "/",
                                ""
                            )
                    );
                }

            }
            catch {
                return null;
            }

            return null;

        }, [videoUrl]);

    // =====================================================
    // VIMEO DETECTION
    // =====================================================

    const vimeoId =
        useMemo(() => {

            if (!videoUrl) {
                return null;
            }

            const match =
                videoUrl.match(
                    /vimeo\.com\/(?:video\/)?(\d+)/
                );

            return match
                ? match[1]
                : null;

        }, [videoUrl]);

    // =====================================================
    // DIRECT VIDEO
    // =====================================================

    const isDirectVideo =
        videoUrl &&
        !youtubeId &&
        !vimeoId;
    // =====================================================
    // VIDEO COMPLETE
    // =====================================================

    const handleVideoEnded = () => {

        console.log(
            "EPIC VIDEO COMPLETED:",
            lessonId
        );

        /*
         * Video completion does NOT automatically
         * complete the lesson.
         *
         * The learner must still click
         * Mark Lesson Complete.
         */
    };

    // =====================================================
    // MARK COMPLETE
    // =====================================================

    const handleCompleteLesson = async () => {

        if (!lesson) {
            return;
        }

        try {

            setCompleting(true);

            console.log(
                "================================="
            );

            console.log(
                "EPIC COMPLETE LESSON"
            );

            console.log(
                "Lesson ID:",
                lessonId
            );

            console.log(
                "================================="
            );

            /*
             * Existing endpoint from your
             * LessonProgressController.
             *
             * If your controller uses a slightly
             * different route, we can adjust it
             * after testing.
             */

            const response =
                await fetch(
                    `${API_BASE_URL}/LessonProgress/complete/${lessonId}`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`,

                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            console.log(
                "Complete lesson response:",
                response.status
            );

            if (!response.ok) {

                let message =
                    "Unable to complete lesson.";

                try {

                    const errorData =
                        await response.json();

                    if (errorData?.message) {
                        message =
                            errorData.message;
                    }

                }
                catch {
                    // Ignore
                }

                throw new Error(message);
            }

            /*
             * Reload the lesson so the UI reflects
             * the database state.
             */

            await loadLesson();

        }
        catch (err) {

            console.error(
                "Error completing lesson:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to complete lesson."
            );

        }
        finally {

            setCompleting(false);

        }

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
    // PROGRESS
    // =====================================================

    const progress =
        Math.min(
            100,
            Math.max(
                0,
                Number(
                    lesson.progress
                        ?.progressPercentage || 0
                )
            )
        );

    const completed =
        lesson.progress
            ?.isCompleted === true;

    // =====================================================
    // COURSE VIEW
    // =====================================================

    return (

        <div className="lesson-viewer">

            {/* =================================================
                TOP NAVIGATION
            ================================================= */}

            <div className="lesson-viewer-topbar">

                <button
                    type="button"
                    className="lesson-back-button"
                    onClick={onBack}
                >
                    <span>
                        ←
                    </span>

                    Back to Course
                </button>

                <span className="lesson-course-label">
                    {lesson.courseTitle ||
                        "EPIC Learning"}
                </span>

            </div>


            {/* =================================================
                LESSON HEADER
            ================================================= */}

            <header className="lesson-viewer-header">

                <span className="lesson-viewer-eyebrow">
                    EPIC LEARNING
                </span>

                <h1>
                    {lesson.title}
                </h1>

                <div className="lesson-viewer-meta">

                    <span>
                        ⏱ {lesson.estimatedMinutes} min
                    </span>

                    {lesson.isFreePreview && (
                        <span className="lesson-preview-badge">
                            Preview
                        </span>
                    )}

                    {completed && (
                        <span className="lesson-completed-badge">
                            ✓ Completed
                        </span>
                    )}

                </div>

            </header>


            {/* =================================================
                VIDEO
            ================================================= */}

            {videoUrl ? (

                <section className="lesson-video-section">

                    <div className="lesson-video-container">

                        {youtubeId ? (

                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title={lesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() =>
                                    setVideoLoading(false)
                                }
                            />

                        ) : vimeoId ? (

                            <iframe
                                src={`https://player.vimeo.com/video/${vimeoId}`}
                                title={lesson.title}
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                onLoad={() =>
                                    setVideoLoading(false)
                                }
                            />

                        ) : isDirectVideo ? (

                            <video
                                controls
                                preload="metadata"
                                onLoadedData={() =>
                                    setVideoLoading(false)
                                }
                                onError={() => {

                                    setVideoLoading(false);
                                    setVideoError(true);

                                }}
                                onEnded={
                                    handleVideoEnded
                                }
                            >

                                <source
                                    src={videoUrl}
                                    type="video/mp4"
                                />

                                Your browser does not support
                                HTML5 video.

                            </video>

                        ) : null}

                        {videoLoading &&
                            !videoError && (

                            <div className="lesson-video-loading">

                                <div className="lesson-video-spinner" />

                                <span>
                                    Loading video...
                                </span>

                            </div>

                        )}

                    </div>

                    {videoError && (

                        <div className="lesson-video-error">

                            <strong>
                                Unable to play this video.
                            </strong>

                            <span>
                                Please check the video URL
                                or try again later.
                            </span>

                        </div>

                    )}

                    <div className="lesson-video-note">

                        🎥 Watch the lesson video before
                        continuing with the lesson.

                    </div>

                </section>

            ) : (

                <section className="lesson-no-video">

                    <div>
                        📖
                    </div>

                    <h2>
                        Reading Lesson
                    </h2>

                    <p>
                        This lesson does not have a video.
                        Continue with the lesson content below.
                    </p>

                </section>

            )}


            {/* =================================================
                PROGRESS
            ================================================= */}

            <section className="lesson-progress-card">

                <div className="lesson-progress-heading">

                    <div>

                        <span>
                            Lesson Progress
                        </span>

                        <strong>
                            {progress}%
                        </strong>

                    </div>

                </div>

                <div className="lesson-progress-track">

                    <div
                        className="lesson-progress-fill"
                        style={{
                            width:
                                `${progress}%`
                        }}
                    />

                </div>

            </section>


            {/* =================================================
                CONTENT
            ================================================= */}

            {lesson.content && (

                <section className="lesson-content-section">

                    <div className="lesson-content-heading">

                        <span>
                            📖
                        </span>

                        <div>

                            <h2>
                                Lesson Content
                            </h2>

                            <p>
                                Study and reflect on this lesson.
                            </p>

                        </div>

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

            {lesson.resourceUrl && (

                <section className="lesson-resource-card">

                    <div>

                        <span className="lesson-resource-icon">
                            📎
                        </span>

                        <div>

                            <h3>
                                Additional Resource
                            </h3>

                            <p>
                                Continue learning with this
                                additional resource.
                            </p>

                        </div>

                    </div>

                    <a
                        href={
                            lesson.resourceUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Resource →
                    </a>

                </section>

            )}


            {/* =================================================
                COMPLETE LESSON
            ================================================= */}

            <section className="lesson-completion-section">

                {completed ? (

                    <div className="lesson-completed-panel">

                        <div className="lesson-completed-icon">
                            ✓
                        </div>

                        <div>

                            <h3>
                                Lesson Completed
                            </h3>

                            <p>
                                Great work! You have completed
                                this lesson.
                            </p>

                        </div>

                    </div>

                ) : (

                    <div className="lesson-completion-panel">

                        <div>

                            <span>
                                Ready to continue?
                            </span>

                            <h3>
                                Complete this lesson
                            </h3>

                            <p>
                                Mark this lesson as complete
                                after you finish studying it.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="lesson-complete-button"
                            disabled={
                                completing
                            }
                            onClick={
                                handleCompleteLesson
                            }
                        >

                            {completing
                                ? "Saving..."
                                : "✓ Mark Lesson Complete"}

                        </button>

                    </div>

                )}

            </section>


            {/* =================================================
                FOOTER NAVIGATION
            ================================================= */}

            <div className="lesson-viewer-footer">

                <button
                    type="button"
                    onClick={onBack}
                >
                    ← Back to Course
                </button>

            </div>

        </div>
    );
};

export default LessonViewer;


