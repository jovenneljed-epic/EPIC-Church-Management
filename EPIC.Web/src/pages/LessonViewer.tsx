
import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

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

interface LessonModule {
    lessons?: LessonData[];
}

interface CourseProgressData {
    courseId?: number;
    courseTitle?: string | null;
    modules?: LessonModule[];
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
    onBack,
}) => {
    // =====================================================
    // STATE
    // =====================================================

    const [lesson, setLesson] =
        useState<LessonData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [videoLoading, setVideoLoading] =
        useState(false);

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
                "Authentication token not found. Please log in again."
            );
        }

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,

                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
            }
        );

        if (!response.ok) {
            let message =
                `Request failed. Status: ${response.status}`;

            try {
                const errorData =
                    await response.json();

                if (
                    errorData?.message
                ) {
                    message =
                        errorData.message;
                } else if (
                    errorData?.title
                ) {
                    message =
                        errorData.title;
                }
            } catch {
                // Ignore invalid JSON response
            }

            throw new Error(message);
        }

        // Some successful requests may have no body.
        if (response.status === 204) {
            return null;
        }

        return response.json();
    };

    // =====================================================
    // LOAD LESSON
    // =====================================================

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

            const courseData =
                (await apiRequest(
                    `/LessonProgress/course/${courseId}`
                )) as CourseProgressData;

            let foundLesson:
                LessonData | null = null;

            // -------------------------------------------------
            // SEARCH LESSON INSIDE COURSE MODULES
            // -------------------------------------------------

            if (
                courseData?.modules &&
                Array.isArray(
                    courseData.modules
                )
            ) {
                for (
                    const module
                    of courseData.modules
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
                            (
                                item
                            ) =>
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
                                courseData.courseId ??
                                courseId,

                            courseTitle:
                                courseData.courseTitle ??
                                null,
                        };

                        break;
                    }
                }
            }

            if (!foundLesson) {
                throw new Error(
                    "Lesson not found in this course."
                );
            }

            console.log(
                "EPIC LESSON DATA:",
                foundLesson
            );

            setLesson(foundLesson);

            // Reset video state.
            const hasVideo =
                Boolean(
                    foundLesson.videoUrl?.trim()
                );

            setVideoLoading(hasVideo);
            setVideoError(false);
        } catch (err) {
            console.error(
                "EPIC LESSON LOAD ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load lesson."
            );

            setLesson(null);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // LOAD WHEN COURSE / LESSON CHANGES
    // =====================================================

    useEffect(() => {
        if (!lessonId) {
            setError("Invalid lesson.");
            setLoading(false);
            return;
        }

        if (!courseId) {
            setError("Invalid course.");
            setLoading(false);
            return;
        }

        loadLesson();
    }, [
        lessonId,
        courseId,
    ]);

    // =====================================================
    // VIDEO URL
    // =====================================================

    const videoUrl =
        lesson?.videoUrl?.trim() || "";

    // =====================================================
    // RESET VIDEO STATE
    // =====================================================

    useEffect(() => {
        setVideoLoading(
            Boolean(videoUrl)
        );

        setVideoError(false);
    }, [
        videoUrl,
    ]);

    // =====================================================
    // YOUTUBE ID
    // =====================================================

    const youtubeId = useMemo(() => {
        if (!videoUrl) {
            return null;
        }

        try {
            const url =
                new URL(videoUrl);

            const hostname =
                url.hostname
                    .toLowerCase()
                    .replace(
                        /^www\./,
                        ""
                    );

            // ---------------------------------------------
            // youtu.be
            // ---------------------------------------------

            if (
                hostname ===
                "youtu.be"
            ) {
                const id =
                    url.pathname
                        .replace(
                            /^\/+/,
                            ""
                        )
                        .split(
                            "/"
                        )[0];

                return id || null;
            }

            // ---------------------------------------------
            // youtube.com
            // ---------------------------------------------

            if (
                hostname ===
                    "youtube.com" ||
                hostname ===
                    "m.youtube.com" ||
                hostname ===
                    "music.youtube.com"
            ) {
                // Standard watch URL
                const watchId =
                    url.searchParams.get(
                        "v"
                    );

                if (watchId) {
                    return watchId;
                }

                // Embed URL
                const embedMatch =
                    url.pathname.match(
                        /^\/embed\/([^/?#]+)/
                    );

                if (
                    embedMatch?.[1]
                ) {
                    return (
                        embedMatch[1]
                    );
                }

                // Shorts URL
                const shortsMatch =
                    url.pathname.match(
                        /^\/shorts\/([^/?#]+)/
                    );

                if (
                    shortsMatch?.[1]
                ) {
                    return (
                        shortsMatch[1]
                    );
                }

                // Live URL
                const liveMatch =
                    url.pathname.match(
                        /^\/live\/([^/?#]+)/
                    );

                if (
                    liveMatch?.[1]
                ) {
                    return (
                        liveMatch[1]
                    );
                }
            }
        } catch {
            return null;
        }

        return null;
    }, [
        videoUrl,
    ]);

    // =====================================================
    // YOUTUBE EMBED URL
    // =====================================================

    const youtubeEmbedUrl =
        useMemo(() => {
            if (!youtubeId) {
                return "";
            }

            return (
                "https://www.youtube-nocookie.com/embed/" +
                `${encodeURIComponent(
                    youtubeId
                )}` +
                "?rel=0&modestbranding=1"
            );
        }, [
            youtubeId,
        ]);

    // =====================================================
    // VIMEO ID
    // =====================================================

    const vimeoId = useMemo(() => {
        if (!videoUrl) {
            return null;
        }

        try {
            const url =
                new URL(videoUrl);

            const hostname =
                url.hostname
                    .toLowerCase()
                    .replace(
                        /^www\./,
                        ""
                    );

            if (
                hostname !==
                    "vimeo.com" &&
                hostname !==
                    "player.vimeo.com"
            ) {
                return null;
            }

            const match =
                url.pathname.match(
                    /\/(?:video\/)?(\d+)/
                );

            return match
                ? match[1]
                : null;
        } catch {
            return null;
        }
    }, [
        videoUrl,
    ]);

    // =====================================================
    // VIMEO EMBED URL
    // =====================================================

    const vimeoEmbedUrl =
        useMemo(() => {
            if (!vimeoId) {
                return "";
            }

            return (
                "https://player.vimeo.com/video/" +
                `${encodeURIComponent(
                    vimeoId
                )}`
            );
        }, [
            vimeoId,
        ]);

    // =====================================================
    // DIRECT VIDEO
    // =====================================================

    const isDirectVideo =
        Boolean(
            videoUrl &&
            !youtubeId &&
            !vimeoId
        );

    // =====================================================
    // VIDEO TYPE
    // =====================================================

    const videoType =
        youtubeId
            ? "youtube"
            : vimeoId
                ? "vimeo"
                : isDirectVideo
                    ? "direct"
                    : "none";

    // =====================================================
    // VIDEO LOADED
    // =====================================================

    const handleVideoLoaded = () => {
        console.log(
            "EPIC VIDEO LOADED:",
            videoType
        );

        setVideoLoading(false);
        setVideoError(false);
    };

    // =====================================================
    // VIDEO ERROR
    // =====================================================

    const handleVideoError = () => {
        console.error(
            "EPIC VIDEO ERROR:",
            {
                lessonId,
                videoType,
                videoUrl,
            }
        );

        setVideoLoading(false);
        setVideoError(true);
    };

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
         * Learner must click:
         *
         * Mark Lesson Complete
         */
    };

    // =====================================================
    // MARK LESSON COMPLETE
    // =====================================================

    const handleCompleteLesson =
        async () => {
            if (!lesson) {
                return;
            }

            const token =
                getToken();

            if (!token) {
                alert(
                    "Your session has expired. Please log in again."
                );

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

                const response =
                    await fetch(
                        `${API_BASE_URL}/LessonProgress/complete/${lessonId}`,
                        {
                            method: "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                Accept:
                                    "application/json",

                                "Content-Type":
                                    "application/json",
                            },
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

                        if (
                            errorData?.message
                        ) {
                            message =
                                errorData.message;
                        } else if (
                            errorData?.title
                        ) {
                            message =
                                errorData.title;
                        }
                    } catch {
                        // Ignore invalid JSON
                    }

                    throw new Error(
                        message
                    );
                }

                /*
                 * Reload the lesson from the API
                 * so the UI uses the actual database
                 * progress state.
                 */

                await loadLesson();
            } catch (err) {
                console.error(
                    "EPIC COMPLETE LESSON ERROR:",
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
                        ?.progressPercentage ??
                    0
                )
            )
        );

    const completed =
        lesson.progress
            ?.isCompleted === true;

    // =====================================================
    // VIEW
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

                        {/* =====================================
                            YOUTUBE
                        ===================================== */}

                        {youtubeId && (
                            <iframe
                                key={
                                    youtubeEmbedUrl
                                }
                                src={
                                    youtubeEmbedUrl
                                }
                                title={
                                    lesson.title
                                }
                                frameBorder="0"
                                loading="lazy"
                                allow="
                                    accelerometer;
                                    autoplay;
                                    clipboard-write;
                                    encrypted-media;
                                    gyroscope;
                                    picture-in-picture;
                                    web-share
                                "
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                                onLoad={
                                    handleVideoLoaded
                                }
                                onError={
                                    handleVideoError
                                }
                            />
                        )}

                        {/* =====================================
                            VIMEO
                        ===================================== */}

                        {!youtubeId &&
                            vimeoId && (
                                <iframe
                                    key={
                                        vimeoEmbedUrl
                                    }
                                    src={
                                        vimeoEmbedUrl
                                    }
                                    title={
                                        lesson.title
                                    }
                                    frameBorder="0"
                                    loading="lazy"
                                    allow="
                                        autoplay;
                                        fullscreen;
                                        picture-in-picture
                                    "
                                    allowFullScreen
                                    onLoad={
                                        handleVideoLoaded
                                    }
                                    onError={
                                        handleVideoError
                                    }
                                />
                            )}

                        {/* =====================================
                            DIRECT MP4
                        ===================================== */}

                        {!youtubeId &&
                            !vimeoId &&
                            isDirectVideo && (
                                <video
                                    controls
                                    preload="metadata"
                                    playsInline
                                    onLoadedData={
                                        handleVideoLoaded
                                    }
                                    onCanPlay={
                                        handleVideoLoaded
                                    }
                                    onError={
                                        handleVideoError
                                    }
                                    onEnded={
                                        handleVideoEnded
                                    }
                                >
                                    <source
                                        src={
                                            videoUrl
                                        }
                                        type="video/mp4"
                                    />

                                    Your browser does not
                                    support HTML5 video.
                                </video>
                            )}

                        {/* =====================================
                            VIDEO LOADING
                        ===================================== */}

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

                    {/* =========================================
                        VIDEO ERROR
                    ========================================= */}

                    {videoError && (
                        <div className="lesson-video-error">

                            <strong>
                                Unable to play this video.
                            </strong>

                            <span>
                                Please check the video URL
                                or try again later.
                            </span>

                            {youtubeId && (
                                <a
                                    href={
                                        `https://www.youtube.com/watch?v=${encodeURIComponent(
                                            youtubeId
                                        )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open video on YouTube →
                                </a>
                            )}

                        </div>
                    )}

                    <div className="lesson-video-note">
                        🎥 Watch the lesson video before
                        continuing with the lesson.
                    </div>

                </section>
            ) : (
                /* =============================================
                   NO VIDEO
                ============================================= */

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
                                `${progress}%`,
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
                                lesson.content,
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
                FOOTER
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

