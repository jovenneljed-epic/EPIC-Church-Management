import React, { useEffect, useState, useMemo } from "react";
import "./LessonPage.css";
import { API_BASE_URL } from "../../config";
import type { QuizData } from "./learningTemplates";
import {
    formatVideoEmbedUrl,
    formatGoogleSheetsEmbedUrl,
} from "./learningTemplates";
import PermissionService from "../../PermissionService";
import { LessonEditorModal } from "./LessonEditorModal";

// =========================================================
// TYPES
// =========================================================

interface LessonData {
    lessonId: number;
    title: string;
    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    lessonType?: string | null;
    googleClassroomUrl?: string | null;
    googleSheetsUrl?: string | null;
    quizDataJson?: string | null;
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
    courseId?: number;
    lessonId: number;
    onBack: () => void;
    onLessonSelect?: (lessonId: number) => void;
}

// =========================================================
// COMPONENT
// =========================================================

const LessonPage: React.FC<LessonPageProps> = ({
    courseId,
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

    const [courseModules, setCourseModules] =
        useState<{ courseModuleId: number; title: string }[]>([]);

    const [isEditorOpen, setIsEditorOpen] =
        useState(false);

    const [quizAnswers, setQuizAnswers] =
        useState<Record<string, number | string>>({});

    const [quizSubmitted, setQuizSubmitted] =
        useState(false);

    const [quizScore, setQuizScore] =
        useState<number | null>(null);

    const [quizPassed, setQuizPassed] =
        useState<boolean | null>(null);

    const isCurriculumSpecialist =
        PermissionService.isAdministrator() ||
        PermissionService.canCreate("EPIC Learning");

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
    // LOAD LESSON WHEN LESSON ID CHANGES
    // =========================================================

    useEffect(() => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
        setQuizPassed(null);

        if (!lessonId) {
            setError("Invalid lesson.");
            setLoading(false);
            return;
        }

        void loadLesson();
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

                lessonType:
                    data.lessonType ??
                    null,

                googleClassroomUrl:
                    data.googleClassroomUrl ??
                    null,

                googleSheetsUrl:
                    data.googleSheetsUrl ??
                    null,

                quizDataJson:
                    data.quizDataJson ??
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
                    data.courseId ??
                    courseId,

                courseModuleId:
                    data.courseModuleId,

                moduleTitle:
                    data.moduleTitle
            };

            setLesson(loadedLesson);

            // =====================================================
            // LOAD COURSE NAVIGATION
            // =====================================================

            const navigationCourseId =
                loadedLesson.courseId ??
                courseId;

            if (navigationCourseId) {
                await loadNavigation(
                    navigationCourseId
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
        currentCourseId: number
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
                currentCourseId
            );

            const response = await fetch(
                `${API_BASE_URL}/LessonProgress/course/${currentCourseId}`,
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
                setCourseModules(
                    data.modules.map((m: any) => ({
                        courseModuleId: m.courseModuleId,
                        title: m.title || `Module #${m.courseModuleId}`
                    }))
                );

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
                            lesson?.courseId ??
                            courseId
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

            const currentCourseId =
                lesson?.courseId ??
                courseId;

            if (currentCourseId) {
                await loadNavigation(
                    currentCourseId
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

            const currentCourseId =
                lesson?.courseId ??
                courseId;

            if (currentCourseId) {
                await loadNavigation(
                    currentCourseId
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
    // QUIZ LOGIC
    // =========================================================

    const quizData: QuizData | null = useMemo(() => {
        if (!lesson?.quizDataJson) return null;
        try {
            return JSON.parse(lesson.quizDataJson) as QuizData;
        } catch {
            return null;
        }
    }, [lesson?.quizDataJson]);

    const handleSelectOption = (questionId: string, optionIndex: number) => {
        if (quizSubmitted && quizPassed) return;
        setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmitQuiz = async () => {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) return;
        let totalPoints = 0;
        let earnedPoints = 0;

        quizData.questions.forEach(q => {
            const pts = q.points || 1;
            totalPoints += pts;
            const selected = quizAnswers[q.id];
            if (selected !== undefined && Number(selected) === q.correctAnswer) {
                earnedPoints += pts;
            }
        });

        const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
        const passed = percentage >= (quizData.passingScorePercent || 70);

        setQuizScore(percentage);
        setQuizPassed(passed);
        setQuizSubmitted(true);

        if (passed && !lesson?.isCompleted) {
            await completeLesson();
        }
    };

    const handleRetakeQuiz = () => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
        setQuizPassed(null);
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

                    {lesson.lessonType && (
                        <span className="lesson-header-type">
                            🏷 {lesson.lessonType}
                        </span>
                    )}

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

                    {isCurriculumSpecialist && (
                        <button
                            type="button"
                            className="lesson-header-edit-btn"
                            onClick={() => setIsEditorOpen(true)}
                            title="Edit this lesson in Curriculum Studio"
                        >
                            ✏ Edit Lesson
                        </button>
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
                            src={formatVideoEmbedUrl(lesson.videoUrl) || undefined}
                            title={lesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
                GOOGLE CLASSROOM
            ================================================= */}

            {lesson.googleClassroomUrl && (
                <div className="lesson-classroom-card">

                    <div className="lesson-classroom-icon">
                        🎓
                    </div>

                    <div className="lesson-classroom-info">

                        <div className="lesson-classroom-badge">
                            GOOGLE CLASSROOM
                        </div>

                        <h3>
                            Classroom Activities & Assignments
                        </h3>

                        <p>
                            This lesson connects to your Google Classroom stream for assignments, homework submissions, and cohort discussions.
                        </p>

                        <span className="lesson-classroom-url-preview">
                            {lesson.googleClassroomUrl}
                        </span>

                    </div>

                    <a
                        href={lesson.googleClassroomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lesson-classroom-button"
                    >
                        Open in Google Classroom ↗
                    </a>

                </div>
            )}

            {/* =================================================
                GOOGLE SHEETS
            ================================================= */}

            {lesson.googleSheetsUrl && (
                <div className="lesson-sheets-card">

                    <div className="lesson-sheets-header">

                        <div className="lesson-sheets-icon">
                            📊
                        </div>

                        <div className="lesson-sheets-info">

                            <div className="lesson-sheets-badge">
                                GOOGLE WORKBOOK / RUBRIC
                            </div>

                            <h3>
                                Interactive Google Sheets Companion
                            </h3>

                            <p>
                                Work directly in the embedded spreadsheet below or open it in a new window to view formulas and rubrics.
                            </p>

                        </div>

                        <a
                            href={lesson.googleSheetsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lesson-sheets-button"
                        >
                            Open in Full Sheet ↗
                        </a>

                    </div>

                    <div className="lesson-sheets-iframe-wrapper">

                        <iframe
                            src={formatGoogleSheetsEmbedUrl(lesson.googleSheetsUrl) || undefined}
                            title="Interactive Google Sheet"
                            className="lesson-sheets-iframe"
                            sandbox="allow-scripts allow-same-origin allow-popups"
                        />

                    </div>

                </div>
            )}

            {/* =================================================
                SUMMATIVE ASSESSMENT / QUIZ
            ================================================= */}

            {quizData && quizData.questions && quizData.questions.length > 0 && (
                <section className="lesson-quiz-section">

                    <div className="lesson-quiz-header">

                        <div className="lesson-quiz-icon">
                            📝
                        </div>

                        <div className="lesson-quiz-intro">

                            <div className="lesson-quiz-badge">
                                SUMMATIVE ASSESSMENT
                            </div>

                            <h2>
                                {quizData.title || "Lesson Summative Test"}
                            </h2>

                            <p>
                                {quizData.description ||
                                    "Test your mastery of this lesson's key concepts. Passing automatically updates your course progress."}
                            </p>

                            <div className="lesson-quiz-meta-row">

                                <span>
                                    🎯 Passing Threshold: <strong>{quizData.passingScorePercent || 70}%</strong>
                                </span>

                                <span>
                                    📋 Questions: <strong>{quizData.questions.length}</strong>
                                </span>

                                {lesson.isCompleted && (
                                    <span className="lesson-quiz-passed-badge">
                                        ✓ Requirements Met
                                    </span>
                                )}

                            </div>

                        </div>

                    </div>

                    {quizSubmitted && (
                        <div
                            className={`lesson-quiz-banner ${
                                quizPassed ? "passed" : "failed"
                            }`}
                        >

                            <div className="quiz-banner-icon">
                                {quizPassed ? "🎉" : "⚠️"}
                            </div>

                            <div className="quiz-banner-content">

                                <h3>
                                    {quizPassed
                                        ? "Assessment Passed!"
                                        : "Passing Score Not Met"}
                                </h3>

                                <p>
                                    Your Score: <strong>{quizScore}%</strong> (Passing requirement: {quizData.passingScorePercent || 70}%).
                                    {quizPassed
                                        ? " Congratulations! Your lesson completion has been recorded."
                                        : " Review the questions and explanations below, then retake the assessment when ready."}
                                </p>

                            </div>

                            {!quizPassed && (
                                <button
                                    type="button"
                                    className="lesson-quiz-retake-btn"
                                    onClick={handleRetakeQuiz}
                                >
                                    🔄 Retake Assessment
                                </button>
                            )}

                        </div>
                    )}

                    <div className="lesson-quiz-questions">

                        {quizData.questions.map((question, qIdx) => {
                            const selected = quizAnswers[question.id];
                            const isCorrect =
                                selected !== undefined &&
                                Number(selected) === question.correctAnswer;

                            return (
                                <div
                                    key={question.id || qIdx}
                                    className={`lesson-quiz-card ${
                                        quizSubmitted
                                            ? isCorrect
                                                ? "q-correct"
                                                : "q-incorrect"
                                            : ""
                                    }`}
                                >

                                    <div className="lesson-quiz-card-top">

                                        <span className="q-number">
                                            Question {qIdx + 1}
                                        </span>

                                        <span className="q-points">
                                            {question.points || 1} pt{(question.points || 1) > 1 ? "s" : ""}
                                        </span>

                                    </div>

                                    <h4 className="lesson-quiz-prompt">
                                        {question.question}
                                    </h4>

                                    <div className="lesson-quiz-options">

                                        {question.options.map((opt, optIdx) => {
                                            const isSelected = selected === optIdx;
                                            const isThisCorrect =
                                                quizSubmitted &&
                                                optIdx === question.correctAnswer;
                                            const isThisWrong =
                                                quizSubmitted &&
                                                isSelected &&
                                                !isCorrect;

                                            return (
                                                <button
                                                    key={optIdx}
                                                    type="button"
                                                    className={`lesson-quiz-option ${
                                                        isSelected ? "selected" : ""
                                                    } ${isThisCorrect ? "correct" : ""} ${
                                                        isThisWrong ? "wrong" : ""
                                                    }`}
                                                    onClick={() =>
                                                        handleSelectOption(
                                                            question.id,
                                                            optIdx
                                                        )
                                                    }
                                                    disabled={
                                                        quizSubmitted &&
                                                        !!quizPassed
                                                    }
                                                >

                                                    <span className="option-radio">
                                                        {isSelected ? "●" : "○"}
                                                    </span>

                                                    <span className="option-text">
                                                        {opt}
                                                    </span>

                                                    {isThisCorrect && (
                                                        <span className="option-badge-correct">
                                                            ✓ Correct
                                                        </span>
                                                    )}

                                                    {isThisWrong && (
                                                        <span className="option-badge-wrong">
                                                            ✗ Your Choice
                                                        </span>
                                                    )}

                                                </button>
                                            );
                                        })}

                                    </div>

                                    {quizSubmitted && question.explanation && (
                                        <div className="lesson-quiz-explanation">
                                            <strong>💡 Curriculum Note:</strong>{" "}
                                            {question.explanation}
                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>

                    {!quizSubmitted && (
                        <div className="lesson-quiz-footer">

                            <button
                                type="button"
                                className="lesson-quiz-submit-btn"
                                onClick={handleSubmitQuiz}
                                disabled={
                                    Object.keys(quizAnswers).length === 0
                                }
                            >
                                Submit Summative Test ({Object.keys(quizAnswers).length}/{quizData.questions.length} answered) →
                            </button>

                        </div>
                    )}

                </section>
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

            {/* =================================================
                CURRICULUM SPECIALIST / ADMIN LESSON EDITOR MODAL
            ================================================= */}

            {isEditorOpen && lesson && (
                <LessonEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    courseId={lesson.courseId ?? 0}
                    courseTitle={lesson.moduleTitle ? `${lesson.moduleTitle}` : undefined}
                    modules={courseModules}
                    moduleId={lesson.courseModuleId ?? 0}
                    initialLesson={{
                        lessonId: lesson.lessonId,
                        title: lesson.title,
                        courseModuleId: lesson.courseModuleId ?? 0,
                        content: lesson.content,
                        videoUrl: lesson.videoUrl,
                        resourceUrl: lesson.resourceUrl,
                        lessonType: lesson.lessonType,
                        googleClassroomUrl: lesson.googleClassroomUrl,
                        googleSheetsUrl: lesson.googleSheetsUrl,
                        quizDataJson: lesson.quizDataJson,
                        estimatedMinutes: lesson.estimatedMinutes,
                        isFreePreview: lesson.isFreePreview
                    }}
                    onSaved={async () => {
                        setIsEditorOpen(false);
                        await loadLesson();
                    }}
                />
            )}

        </div>
    );
};

export default LessonPage;