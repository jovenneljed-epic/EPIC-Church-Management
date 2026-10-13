import React, { useState, useEffect } from "react";
import type {
    LessonTemplate as _LessonTemplate,
    QuizData,
    QuizQuestion,
} from "./learningTemplates";
import {
    READY_MADE_LESSON_TEMPLATES,
    formatVideoEmbedUrl,
    formatGoogleSheetsEmbedUrl,
    isGoogleClassroomUrl,
    isGoogleSheetsUrl,
} from "./learningTemplates";
import "./LessonEditorModal.css";
import { API_BASE_URL } from "../../config";

export interface LessonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId?: number;
    courseTitle?: string;
    modules?: { courseModuleId: number; title: string }[];
    moduleId?: number;
    initialLesson?: any;
    initialTemplateId?: string;
    onSaved: (lesson: any) => void;
}

type TabKey = "templates" | "basics" | "video" | "content" | "classroom" | "assessment";

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
    isOpen,
    onClose,
    courseId: _courseId,
    courseTitle,
    modules = [],
    moduleId,
    initialLesson,
    initialTemplateId,
    onSaved,
}) => {
    const [activeTab, setActiveTab] = useState<TabKey>("basics");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
        initialTemplateId || "discipleship_exposition"
    );

    // Form state
    const [title, setTitle] = useState("");
    const [courseModuleId, setCourseModuleId] = useState<number>(0);
    const [estimatedMinutes, setEstimatedMinutes] = useState(25);
    const [isFreePreview, setIsFreePreview] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    const [videoUrl, setVideoUrl] = useState("");
    const [googleClassroomUrl, setGoogleClassroomUrl] = useState("");
    const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
    const [content, setContent] = useState("");
    const [lessonType, setLessonType] = useState("DISCIPLESHIP");

    // Summative quiz state
    const [quizData, setQuizData] = useState<QuizData>({
        title: "Summative Assessment",
        passingScorePercent: 80,
        questions: [],
    });

    const [contentPreviewMode, setContentPreviewMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Initialize or load existing lesson
    useEffect(() => {
        if (!isOpen) return;

        if (initialLesson) {
            setTitle(initialLesson.title || "");
            setCourseModuleId(initialLesson.courseModuleId || moduleId || (modules[0]?.courseModuleId ?? 0));
            setEstimatedMinutes(initialLesson.estimatedMinutes || 20);
            setIsFreePreview(Boolean(initialLesson.isFreePreview));
            setIsPublished(initialLesson.isPublished !== false);
            setVideoUrl(initialLesson.videoUrl || "");
            setGoogleClassroomUrl(initialLesson.googleClassroomUrl || "");
            setGoogleSheetsUrl(initialLesson.googleSheetsUrl || "");
            setContent(initialLesson.content || "");
            setLessonType(initialLesson.lessonType || "CUSTOM");

            if (initialLesson.quizDataJson) {
                try {
                    const parsed = JSON.parse(initialLesson.quizDataJson);
                    setQuizData(parsed);
                } catch {
                    // Ignore parse error
                }
            }
            setActiveTab("basics");
        } else {
            // Apply template
            const tplId = initialTemplateId || "discipleship_exposition";
            applyTemplate(tplId, false);
            if (moduleId) {
                setCourseModuleId(moduleId);
            } else if (modules[0]?.courseModuleId) {
                setCourseModuleId(modules[0].courseModuleId);
            }
            setActiveTab(initialTemplateId ? "basics" : "templates");
        }
    }, [isOpen, initialLesson, initialTemplateId, modules, moduleId]);

    const applyTemplate = (tplId: string, confirmPrompt = true) => {
        if (confirmPrompt && content.trim().length > 50) {
            if (!window.confirm("Applying a template will overwrite current lesson body and questions. Proceed?")) {
                return;
            }
        }

        const tpl = READY_MADE_LESSON_TEMPLATES.find((t) => t.id === tplId);
        if (!tpl) return;

        setSelectedTemplateId(tpl.id);
        setLessonType(tpl.category.toUpperCase());
        if (!title.trim() || !initialLesson) {
            setTitle(tpl.defaultTitle);
        }
        setEstimatedMinutes(tpl.estimatedMinutes);
        if (tpl.defaultVideoUrl) setVideoUrl(tpl.defaultVideoUrl);
        if (tpl.defaultGoogleClassroomUrl) setGoogleClassroomUrl(tpl.defaultGoogleClassroomUrl);
        if (tpl.defaultGoogleSheetsUrl) setGoogleSheetsUrl(tpl.defaultGoogleSheetsUrl);
        setContent(tpl.defaultContent);

        if (tpl.defaultQuiz) {
            setQuizData(JSON.parse(JSON.stringify(tpl.defaultQuiz)));
        }

        if (modules.length > 0 && courseModuleId === 0) {
            setCourseModuleId(modules[0].courseModuleId);
        }
    };

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken")
        );
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Lesson title is required.");
            setActiveTab("basics");
            return;
        }

        if (!courseModuleId) {
            setError("Please select a module for this lesson.");
            setActiveTab("basics");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const token = getToken();
            const payload = {
                courseModuleId,
                title: title.trim(),
                content: content.trim(),
                videoUrl: videoUrl.trim() || null,
                resourceUrl: googleSheetsUrl.trim() || googleClassroomUrl.trim() || null,
                lessonType,
                googleClassroomUrl: googleClassroomUrl.trim() || null,
                googleSheetsUrl: googleSheetsUrl.trim() || null,
                quizDataJson: quizData.questions.length > 0 ? JSON.stringify(quizData) : null,
                sortOrder: initialLesson?.sortOrder ?? 1,
                estimatedMinutes: Number(estimatedMinutes) || 15,
                isPublished,
                isFreePreview,
            };

            const isEditing = Boolean(initialLesson?.lessonId);
            const url = isEditing
                ? `${API_BASE_URL}/Lessons/${initialLesson.lessonId}`
                : `${API_BASE_URL}/Lessons`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || `Failed to save lesson (status: ${response.status})`);
            }

            const data = await response.json();
            onSaved(data);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save lesson.");
        } finally {
            setSaving(false);
        }
    };

    // Quick Insert Blocks
    const insertContentBlock = (block: string) => {
        setContent((prev) => prev + "\n\n" + block);
    };

    // Quiz Questions Management
    const addQuizQuestion = (type: "multiple_choice" | "true_false" | "short_answer") => {
        const newQ: QuizQuestion = {
            id: `q_${Date.now()}`,
            question: type === "true_false" ? "Statement to verify:" : "New question prompt:",
            type,
            options: type === "true_false" ? ["True", "False"] : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: type === "true_false" ? "True" : 0,
            explanation: "Rationale for the correct answer.",
            points: 20,
        };
        setQuizData((prev) => ({
            ...prev,
            questions: [...prev.questions, newQ],
        }));
    };

    const updateQuestion = (index: number, updated: Partial<QuizQuestion>) => {
        setQuizData((prev) => {
            const nextQuestions = [...prev.questions];
            nextQuestions[index] = { ...nextQuestions[index], ...updated };
            return { ...prev, questions: nextQuestions };
        });
    };

    const deleteQuestion = (index: number) => {
        setQuizData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    if (!isOpen) return null;

    const formattedVideo = formatVideoEmbedUrl(videoUrl);
    const formattedSheets = formatGoogleSheetsEmbedUrl(googleSheetsUrl);

    return (
        <div className="lesson-editor-overlay">
            <div className="lesson-editor-modal">
                {/* Header */}
                <div className="lesson-editor-header">
                    <div className="lesson-editor-title-area">
                        <div className="lesson-editor-icon-badge">🎓</div>
                        <div>
                            <h2>
                                {initialLesson ? "Edit Lesson in Studio" : "Create Lesson from Template"}
                            </h2>
                            <p>
                                {courseTitle ? `Course: ${courseTitle}` : "School Curriculum Specialist Studio"}
                            </p>
                        </div>
                    </div>
                    <button className="lesson-editor-close-btn" onClick={onClose} title="Close">
                        ×
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="lesson-editor-nav">
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "templates" ? "active" : ""}`}
                        onClick={() => setActiveTab("templates")}
                    >
                        <span>📋</span> Ready-Made Templates
                    </button>
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "basics" ? "active" : ""}`}
                        onClick={() => setActiveTab("basics")}
                    >
                        <span>⚙️</span> Lesson Info
                    </button>
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "video" ? "active" : ""}`}
                        onClick={() => setActiveTab("video")}
                    >
                        <span>🎬</span> Video Upload
                        {videoUrl && <span className="lesson-tab-badge">Active</span>}
                    </button>
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "content" ? "active" : ""}`}
                        onClick={() => setActiveTab("content")}
                    >
                        <span>📑</span> Lesson Body
                    </button>
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "classroom" ? "active" : ""}`}
                        onClick={() => setActiveTab("classroom")}
                    >
                        <span>🏫</span> Google Classroom & Sheets
                        {(googleClassroomUrl || googleSheetsUrl) && <span className="lesson-tab-badge">Linked</span>}
                    </button>
                    <button
                        type="button"
                        className={`lesson-editor-tab-btn ${activeTab === "assessment" ? "active" : ""}`}
                        onClick={() => setActiveTab("assessment")}
                    >
                        <span>🏆</span> Summative Test
                        <span className="lesson-tab-badge">{quizData.questions.length} Qs</span>
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{ padding: "12px 26px", background: "rgba(239, 68, 68, 0.15)", borderBottom: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "13px" }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Body Content */}
                <div className="lesson-editor-body">
                    {/* 1. TEMPLATES SELECTOR */}
                    {activeTab === "templates" && (
                        <div>
                            <div style={{ marginBottom: "16px" }}>
                                <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#f8fafc" }}>
                                    Choose a Ready-Made Curriculum Template
                                </h3>
                                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                    Select a professional structure tailored for discipleship, video lectures, Google Classroom assignments, or exams.
                                </p>
                            </div>

                            <div className="templates-selector-grid">
                                {READY_MADE_LESSON_TEMPLATES.map((tpl) => (
                                    <div
                                        key={tpl.id}
                                        className={`template-card-btn ${selectedTemplateId === tpl.id ? "active" : ""}`}
                                        onClick={() => applyTemplate(tpl.id, true)}
                                    >
                                        <div className="template-card-icon">{tpl.icon}</div>
                                        <div className="template-card-info">
                                            <h4>{tpl.name}</h4>
                                            <p>{tpl.description}</p>
                                            <span className="template-card-badge">{tpl.badge} • {tpl.estimatedMinutes}m</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. BASICS & METADATA */}
                    {activeTab === "basics" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div className="editor-form-group">
                                <label>Lesson Title *</label>
                                <input
                                    className="editor-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Lesson 1: Living by Faith and Grace"
                                />
                            </div>

                            <div className="editor-form-row">
                                <div className="editor-form-group">
                                    <label>Assign to Course Module *</label>
                                    <select
                                        className="editor-select"
                                        value={courseModuleId}
                                        onChange={(e) => setCourseModuleId(Number(e.target.value))}
                                    >
                                        <option value={0}>Select Module</option>
                                        {modules.length > 0 ? (
                                            modules.map((m) => (
                                                <option key={m.courseModuleId} value={m.courseModuleId}>
                                                    {m.title}
                                                </option>
                                            ))
                                        ) : courseModuleId ? (
                                            <option value={courseModuleId}>
                                                Assigned Module #{courseModuleId}
                                            </option>
                                        ) : null}
                                    </select>
                                </div>

                                <div className="editor-form-group">
                                    <label>Estimated Minutes</label>
                                    <input
                                        type="number"
                                        className="editor-input"
                                        value={estimatedMinutes}
                                        onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                                        min={1}
                                        max={300}
                                    />
                                </div>

                                <div className="editor-form-group">
                                    <label>Curriculum Category</label>
                                    <select
                                        className="editor-select"
                                        value={lessonType}
                                        onChange={(e) => setLessonType(e.target.value)}
                                    >
                                        <option value="DISCIPLESHIP">Discipleship & Doctrine</option>
                                        <option value="VIDEO_LECTURE">Video Lecture</option>
                                        <option value="GOOGLE_CLASSROOM">Google Classroom Lab</option>
                                        <option value="SUMMATIVE_TEST">Summative Assessment</option>
                                        <option value="PRACTICUM">Ministry Practicum</option>
                                        <option value="CUSTOM">Custom</option>
                                    </select>
                                </div>
                            </div>

                            <div className="editor-form-row" style={{ marginTop: "8px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#e2e8f0" }}>
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        style={{ accentColor: "#10b981", width: "18px", height: "18px" }}
                                    />
                                    <strong>Publish Lesson Immediately</strong> (Students can access this lesson)
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#e2e8f0" }}>
                                    <input
                                        type="checkbox"
                                        checked={isFreePreview}
                                        onChange={(e) => setIsFreePreview(e.target.checked)}
                                        style={{ accentColor: "#3b82f6", width: "18px", height: "18px" }}
                                    />
                                    <strong>Free Preview Lesson</strong> (Accessible to non-enrolled visitors)
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 3. VIDEO STUDIO */}
                    {activeTab === "video" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div className="editor-form-group">
                                <label>
                                    Video Lecture URL (YouTube, Vimeo, or Direct MP4)
                                    <small style={{ color: "#94a3b8" }}>Auto-embeds properly for student players</small>
                                </label>
                                <input
                                    className="editor-input"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                />
                            </div>

                            {formattedVideo ? (
                                <div>
                                    <strong style={{ fontSize: "13px", color: "#60a5fa", display: "block", marginBottom: "8px" }}>
                                        ✓ Live Video Preview
                                    </strong>
                                    <div className="video-preview-box">
                                        <iframe
                                            src={formattedVideo}
                                            title="Video Preview"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: "30px", textAlign: "center", background: "rgba(15, 23, 42, 0.5)", border: "1px dashed rgba(255, 255, 255, 0.1)", borderRadius: "12px", color: "#64748b" }}>
                                    <span>🎬 Paste a video link above to see the live player preview.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. LESSON CONTENT */}
                    {activeTab === "content" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div className="quick-blocks-bar">
                                    <span style={{ fontSize: "12px", color: "#94a3b8", marginRight: "4px" }}>Quick Blocks:</span>
                                    <button
                                        type="button"
                                        className="quick-block-btn"
                                        onClick={() => insertContentBlock('<blockquote style="border-left: 4px solid #3b82f6; padding-left: 14px; margin: 14px 0; color: #93c5fd; font-style: italic;">“Scripture quotation here.” — Reference</blockquote>')}
                                    >
                                        📖 Scripture Box
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-block-btn"
                                        onClick={() => insertContentBlock('<h3>🎯 Learning Objectives</h3>\n<ul>\n  <li>Objective 1</li>\n  <li>Objective 2</li>\n</ul>')}
                                    >
                                        🎯 Objectives
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-block-btn"
                                        onClick={() => insertContentBlock('<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 14px;">\n  <strong style="color: #34d399;">💡 Key Principle:</strong>\n  <p style="margin: 4px 0 0; color: #cbd5e1;">Insert core insight.</p>\n</div>')}
                                    >
                                        💡 Callout Box
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-block-btn"
                                        onClick={() => insertContentBlock('<h3>🤝 Discussion & Reflection</h3>\n<ol>\n  <li>Reflection question 1</li>\n  <li>Reflection question 2</li>\n</ol>')}
                                    >
                                        🤝 Discussion
                                    </button>
                                </div>

                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        type="button"
                                        className={`quick-block-btn ${!contentPreviewMode ? "active" : ""}`}
                                        onClick={() => setContentPreviewMode(false)}
                                    >
                                        Edit HTML
                                    </button>
                                    <button
                                        type="button"
                                        className={`quick-block-btn ${contentPreviewMode ? "active" : ""}`}
                                        onClick={() => setContentPreviewMode(true)}
                                    >
                                        Preview Output
                                    </button>
                                </div>
                            </div>

                            {contentPreviewMode ? (
                                <div
                                    style={{
                                        minHeight: "260px",
                                        padding: "20px",
                                        background: "rgba(15, 23, 42, 0.7)",
                                        border: "1px solid rgba(255, 255, 255, 0.12)",
                                        borderRadius: "10px",
                                        color: "#e2e8f0",
                                        overflowY: "auto"
                                    }}
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            ) : (
                                <textarea
                                    className="editor-textarea"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Enter your lesson exposition, scripture references, and discussion prompts..."
                                />
                            )}
                        </div>
                    )}

                    {/* 5. GOOGLE CLASSROOM & SHEETS */}
                    {activeTab === "classroom" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Google Classroom Card */}
                            <div className="integration-card">
                                <div className="integration-card-header">
                                    <div className="integration-badge classroom">
                                        <span>🏫</span> Google Classroom Assignment Link
                                    </div>
                                    {googleClassroomUrl && isGoogleClassroomUrl(googleClassroomUrl) && (
                                        <a
                                            href={googleClassroomUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="quick-block-btn"
                                            style={{ textDecoration: "none" }}
                                        >
                                            Test Link ↗
                                        </a>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                    Connect this lesson to your Google Classroom stream so students can turn in homework, view rosters, or join discussion boards.
                                </p>
                                <input
                                    className="editor-input"
                                    value={googleClassroomUrl}
                                    onChange={(e) => setGoogleClassroomUrl(e.target.value)}
                                    placeholder="https://classroom.google.com/c/... or class code link"
                                />
                            </div>

                            {/* Google Sheets Card */}
                            <div className="integration-card">
                                <div className="integration-card-header">
                                    <div className="integration-badge sheets">
                                        <span>📊</span> Google Sheets Worksheet / Gradebook Link
                                    </div>
                                    {googleSheetsUrl && (
                                        <a
                                            href={googleSheetsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="quick-block-btn"
                                            style={{ textDecoration: "none" }}
                                        >
                                            Open Sheet ↗
                                        </a>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                    Embed an interactive spreadsheet for ministry budgets, student rosters, attendance tracking, or activity worksheets.
                                </p>
                                <input
                                    className="editor-input"
                                    value={googleSheetsUrl}
                                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                                />

                                {formattedSheets && isGoogleSheetsUrl(googleSheetsUrl) && (
                                    <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", height: "240px" }}>
                                        <iframe
                                            src={formattedSheets}
                                            title="Google Sheets Preview"
                                            style={{ width: "100%", height: "100%", border: "none" }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 6. SUMMATIVE ASSESSMENT BUILDER */}
                    {activeTab === "assessment" && (
                        <div className="quiz-builder-container">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>
                                        Summative Test / Examination Engine
                                    </h3>
                                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                                        Students must achieve the passing threshold to complete the lesson and unlock the next milestone.
                                    </p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Passing Score:</span>
                                    <select
                                        className="editor-select"
                                        style={{ width: "110px", padding: "6px 10px" }}
                                        value={quizData.passingScorePercent}
                                        onChange={(e) => setQuizData({ ...quizData, passingScorePercent: Number(e.target.value) })}
                                    >
                                        <option value={70}>70%</option>
                                        <option value={75}>75%</option>
                                        <option value={80}>80% (Std)</option>
                                        <option value={85}>85%</option>
                                        <option value={90}>90%</option>
                                        <option value={100}>100%</option>
                                    </select>
                                </div>
                            </div>

                            {/* Add Question Bar */}
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>+ Add Question:</span>
                                <button
                                    type="button"
                                    className="quick-block-btn"
                                    onClick={() => addQuizQuestion("multiple_choice")}
                                >
                                    Multiple Choice
                                </button>
                                <button
                                    type="button"
                                    className="quick-block-btn"
                                    onClick={() => addQuizQuestion("true_false")}
                                >
                                    True / False
                                </button>
                                <button
                                    type="button"
                                    className="quick-block-btn"
                                    onClick={() => addQuizQuestion("short_answer")}
                                >
                                    Short Answer / Reflection
                                </button>
                            </div>

                            {/* Questions List */}
                            {quizData.questions.length === 0 ? (
                                <div style={{ padding: "30px", textAlign: "center", background: "rgba(15, 23, 42, 0.4)", border: "1px dashed rgba(255, 255, 255, 0.1)", borderRadius: "12px", color: "#64748b" }}>
                                    <span>No test questions added yet. Click "+ Add Question" above to build your summative test.</span>
                                </div>
                            ) : (
                                quizData.questions.map((q, qIndex) => (
                                    <div key={q.id} className="quiz-question-card">
                                        <div className="quiz-question-card-header">
                                            <span className="quiz-question-number">
                                                QUESTION #{qIndex + 1} ({q.type.replace("_", " ").toUpperCase()})
                                            </span>
                                            <button
                                                type="button"
                                                className="quiz-delete-question-btn"
                                                onClick={() => deleteQuestion(qIndex)}
                                                title="Delete Question"
                                            >
                                                🗑
                                            </button>
                                        </div>

                                        <input
                                            className="editor-input"
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                                            placeholder="Enter question prompt..."
                                        />

                                        {/* Multiple Choice Options */}
                                        {q.type === "multiple_choice" && (
                                            <div className="quiz-options-list">
                                                <small style={{ color: "#94a3b8" }}>Select the radio button beside the correct answer:</small>
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className="quiz-option-row">
                                                        <input
                                                            type="radio"
                                                            name={`correct_${q.id}`}
                                                            checked={q.correctAnswer === optIndex}
                                                            onChange={() => updateQuestion(qIndex, { correctAnswer: optIndex })}
                                                            className="quiz-correct-radio"
                                                            title="Mark as correct answer"
                                                        />
                                                        <input
                                                            className="editor-input"
                                                            style={{ flex: 1 }}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...q.options];
                                                                newOpts[optIndex] = e.target.value;
                                                                updateQuestion(qIndex, { options: newOpts });
                                                            }}
                                                            placeholder={`Choice ${String.fromCharCode(65 + optIndex)}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* True / False Options */}
                                        {q.type === "true_false" && (
                                            <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#e2e8f0" }}>
                                                    <input
                                                        type="radio"
                                                        name={`tf_${q.id}`}
                                                        checked={q.correctAnswer === "True"}
                                                        onChange={() => updateQuestion(qIndex, { correctAnswer: "True" })}
                                                        className="quiz-correct-radio"
                                                    />
                                                    <strong>Correct Answer: True</strong>
                                                </label>
                                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#e2e8f0" }}>
                                                    <input
                                                        type="radio"
                                                        name={`tf_${q.id}`}
                                                        checked={q.correctAnswer === "False"}
                                                        onChange={() => updateQuestion(qIndex, { correctAnswer: "False" })}
                                                        className="quiz-correct-radio"
                                                    />
                                                    <strong>Correct Answer: False</strong>
                                                </label>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        <div style={{ marginTop: "4px" }}>
                                            <input
                                                className="editor-input"
                                                style={{ fontSize: "12px" }}
                                                value={q.explanation || ""}
                                                onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                                                placeholder="Explanation / feedback shown to student after submitting (optional)..."
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="lesson-editor-footer">
                    <div>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                            School Curriculum Specialist Studio • Autosaves ready
                        </span>
                    </div>
                    <div className="lesson-editor-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving Lesson..." : initialLesson ? "Save Changes" : "Create & Publish Lesson"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
