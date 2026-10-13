import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config";
import { READY_MADE_LESSON_TEMPLATES } from "./learningTemplates";
import { LessonEditorModal } from "./LessonEditorModal";
import "./CurriculumStudio.css";

interface Course {
    courseId: number;
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnailUrl?: string;
    category?: string;
    level?: string;
    estimatedMinutes: number;
    isPublished: boolean;
    isFeatured: boolean;
    instructorName?: string;
    googleClassroomUrl?: string;
    googleSheetsUrl?: string;
    moduleCount: number;
    lessonCount: number;
    createdDate: string;
}

interface CurriculumStudioProps {
    onSwitchToLearnerView: () => void;
    onViewCourse: (courseId: number) => void;
}

type StudioTab = "courses" | "templates" | "assessments" | "enrollments";

export const CurriculumStudio: React.FC<CurriculumStudioProps> = ({
    onSwitchToLearnerView,
    onViewCourse,
}) => {
    const [activeTab, setActiveTab] = useState<StudioTab>("courses");
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Course Modal (Create / Edit)
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [courseForm, setCourseForm] = useState({
        title: "",
        instructorName: "Pastor Ronnel M. Aviguetero",
        category: "Discipleship",
        level: "Beginner",
        estimatedMinutes: 60,
        thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=60",
        googleClassroomUrl: "",
        googleSheetsUrl: "",
        description: "",
        isPublished: true,
        isFeatured: false,
    });
    const [savingCourse, setSavingCourse] = useState(false);

    // Module Modal (Add Module)
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleCourseId, setModuleCourseId] = useState<number>(0);
    const [moduleTitle, setModuleTitle] = useState("");
    const [moduleDesc, setModuleDesc] = useState("");
    const [savingModule, setSavingModule] = useState(false);

    // Lesson Editor Modal
    const [lessonModalOpen, setLessonModalOpen] = useState(false);
    const [lessonModalCourseId, setLessonModalCourseId] = useState<number>(0);
    const [lessonModalCourseTitle, setLessonModalCourseTitle] = useState<string>("");
    const [lessonModalModules, setLessonModalModules] = useState<{ courseModuleId: number; title: string }[]>([]);
    const [lessonModalInitialTemplate, setLessonModalInitialTemplate] = useState<string | undefined>(undefined);
    const [editingLessonData, setEditingLessonData] = useState<any | null>(null);

    // Student Enrollments Data
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken")
        );
    };

    // Load Courses
    const loadCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/Courses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!res.ok) throw new Error("Failed to load courses.");
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || "Failed to load courses.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load Enrollments
    const loadEnrollments = useCallback(async () => {
        try {
            setLoadingEnrollments(true);
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/CourseEnrollments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) {
                const data = await res.json();
                setEnrollments(Array.isArray(data) ? data : []);
            }
        } catch {
            // Ignore
        } finally {
            setLoadingEnrollments(false);
        }
    }, []);

    useEffect(() => {
        loadCourses();
        loadEnrollments();
    }, [loadCourses, loadEnrollments]);

    // Open Course Creator
    const openCreateCourse = () => {
        setEditingCourseId(null);
        setCourseForm({
            title: "",
            instructorName: "Pastor Ronnel M. Aviguetero",
            category: "Discipleship",
            level: "Beginner",
            estimatedMinutes: 60,
            thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=60",
            googleClassroomUrl: "",
            googleSheetsUrl: "",
            description: "",
            isPublished: true,
            isFeatured: false,
        });
        setShowCourseModal(true);
    };

    // Open Course Editor
    const openEditCourse = async (courseId: number) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/Courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load course details.");
            const c = await res.json();

            setEditingCourseId(courseId);
            setCourseForm({
                title: c.title || "",
                instructorName: c.instructorName || "Pastor Ronnel M. Aviguetero",
                category: c.category || "Discipleship",
                level: c.level || "Beginner",
                estimatedMinutes: c.estimatedMinutes || 60,
                thumbnailUrl: c.thumbnailUrl || "",
                googleClassroomUrl: c.googleClassroomUrl || "",
                googleSheetsUrl: c.googleSheetsUrl || "",
                description: c.description || c.shortDescription || "",
                isPublished: Boolean(c.isPublished),
                isFeatured: Boolean(c.isFeatured),
            });
            setShowCourseModal(true);
        } catch (err: any) {
            alert(err.message || "Failed to edit course.");
        }
    };

    // Save Course
    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseForm.title.trim()) {
            alert("Course title is required.");
            return;
        }

        try {
            setSavingCourse(true);
            const token = getToken();
            const payload = {
                title: courseForm.title.trim(),
                instructorName: courseForm.instructorName.trim(),
                category: courseForm.category,
                level: courseForm.level,
                estimatedMinutes: Number(courseForm.estimatedMinutes) || 60,
                thumbnailUrl: courseForm.thumbnailUrl.trim() || null,
                googleClassroomUrl: courseForm.googleClassroomUrl.trim() || null,
                googleSheetsUrl: courseForm.googleSheetsUrl.trim() || null,
                description: courseForm.description.trim(),
                shortDescription: courseForm.description.slice(0, 200),
                isPublished: courseForm.isPublished,
                isFeatured: courseForm.isFeatured,
            };

            const isEdit = editingCourseId !== null;
            const url = isEdit ? `${API_BASE_URL}/Courses/${editingCourseId}` : `${API_BASE_URL}/Courses`;

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save course.");

            setShowCourseModal(false);
            await loadCourses();
        } catch (err: any) {
            alert(err.message || "Failed to save course.");
        } finally {
            setSavingCourse(false);
        }
    };

    // Delete Course
    const handleDeleteCourse = async (courseId: number, title: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete course "${title}"?`)) {
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/Courses/${courseId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete course.");
            await loadCourses();
        } catch (err: any) {
            alert(err.message || "Failed to delete course.");
        }
    };

    // Open Add Module Modal
    const openAddModule = (courseId: number) => {
        setModuleCourseId(courseId);
        setModuleTitle("");
        setModuleDesc("");
        setShowModuleModal(true);
    };

    // Save Module
    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moduleTitle.trim()) {
            alert("Module title is required.");
            return;
        }

        try {
            setSavingModule(true);
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/CourseModules`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    courseId: moduleCourseId,
                    title: moduleTitle.trim(),
                    description: moduleDesc.trim() || null,
                    sortOrder: 1,
                    isPublished: true,
                }),
            });

            if (!res.ok) throw new Error("Failed to create module.");

            setShowModuleModal(false);
            await loadCourses();
        } catch (err: any) {
            alert(err.message || "Failed to create module.");
        } finally {
            setSavingModule(false);
        }
    };

    // Open Lesson Creator Modal
    const openCreateLesson = async (courseId?: number, templateId?: string) => {
        const targetCourseId = courseId || courses[0]?.courseId;
        if (!targetCourseId) {
            alert("Please create a course first before creating lessons.");
            openCreateCourse();
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/Courses/${targetCourseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load course modules.");
            const c = await res.json();

            let courseModules = (c.modules || []).map((m: any) => ({
                courseModuleId: m.courseModuleId,
                title: m.title,
            }));

            // If no modules exist yet, create a default module first
            if (courseModules.length === 0) {
                const modRes = await fetch(`${API_BASE_URL}/CourseModules`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        courseId: targetCourseId,
                        title: "Module 1: Foundations",
                        description: "Core curriculum foundations.",
                        sortOrder: 1,
                        isPublished: true,
                    }),
                });
                if (modRes.ok) {
                    const newMod = await modRes.json();
                    courseModules = [{ courseModuleId: newMod.courseModuleId, title: newMod.title }];
                }
            }

            setLessonModalCourseId(targetCourseId);
            setLessonModalCourseTitle(c.title || "");
            setLessonModalModules(courseModules);
            setLessonModalInitialTemplate(templateId);
            setEditingLessonData(null);
            setLessonModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Failed to open lesson editor.");
        }
    };

    // Quick Stats Calculation
    const totalLessons = courses.reduce((acc, c) => acc + (c.lessonCount || 0), 0);
    const totalPublished = courses.filter((c) => c.isPublished).length;
    const totalGoogleClassrooms = courses.filter((c) => Boolean(c.googleClassroomUrl)).length;

    return (
        <div className="curriculum-studio">
            {/* Header */}
            <div className="studio-header">
                <div className="studio-header-left">
                    <div className="studio-avatar-badge">🎓</div>
                    <div className="studio-header-title-box">
                        <h1>
                            School Curriculum & Learning Studio
                            <span className="studio-role-pill">CURRICULUM SPECIALIST</span>
                        </h1>
                        <p>
                            Professional course authoring, ready-made lesson templates, video uploads, Google Classroom integration, and summative assessments.
                        </p>
                    </div>
                </div>

                <div className="studio-header-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onSwitchToLearnerView}
                        title="Preview how enrolled students experience courses"
                    >
                        👁️ Switch to Learner View (Preview)
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => openCreateLesson(undefined, "discipleship_exposition")}
                    >
                        ＋ Create Lesson from Template
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openCreateCourse}
                    >
                        ＋ New Course / Track
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "12px 18px", margin: "16px 0", background: "#fef2f2", color: "#991b1b", borderRadius: "10px", border: "1px solid #fca5a5", fontSize: "14px" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* KPI Stat Cards */}
            <div className="studio-stats-grid">
                <div className="studio-stat-card">
                    <div className="studio-stat-icon blue">📚</div>
                    <div className="studio-stat-content">
                        <span>Total Courses</span>
                        <strong>{courses.length} ({totalPublished} pub)</strong>
                    </div>
                </div>
                <div className="studio-stat-card">
                    <div className="studio-stat-icon emerald">📑</div>
                    <div className="studio-stat-content">
                        <span>Active Lessons</span>
                        <strong>{totalLessons}</strong>
                    </div>
                </div>
                <div className="studio-stat-card">
                    <div className="studio-stat-icon purple">👥</div>
                    <div className="studio-stat-content">
                        <span>Enrolled Learners</span>
                        <strong>{enrollments.length}</strong>
                    </div>
                </div>
                <div className="studio-stat-card">
                    <div className="studio-stat-icon amber">🏫</div>
                    <div className="studio-stat-content">
                        <span>Google Classrooms</span>
                        <strong>{totalGoogleClassrooms}</strong>
                    </div>
                </div>
                <div className="studio-stat-card">
                    <div className="studio-stat-icon rose">🏆</div>
                    <div className="studio-stat-content">
                        <span>Summative Exams</span>
                        <strong>{courses.length}</strong>
                    </div>
                </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="studio-tabs">
                <button
                    type="button"
                    className={`studio-tab-btn ${activeTab === "courses" ? "active" : ""}`}
                    onClick={() => setActiveTab("courses")}
                >
                    <span>📚</span> Curriculum & Courses ({courses.length})
                </button>
                <button
                    type="button"
                    className={`studio-tab-btn ${activeTab === "templates" ? "active" : ""}`}
                    onClick={() => setActiveTab("templates")}
                >
                    <span>📋</span> Ready-Made Templates Library ({READY_MADE_LESSON_TEMPLATES.length})
                </button>
                <button
                    type="button"
                    className={`studio-tab-btn ${activeTab === "assessments" ? "active" : ""}`}
                    onClick={() => setActiveTab("assessments")}
                >
                    <span>🏆</span> Summative Assessments
                </button>
                <button
                    type="button"
                    className={`studio-tab-btn ${activeTab === "enrollments" ? "active" : ""}`}
                    onClick={() => setActiveTab("enrollments")}
                >
                    <span>👥</span> Student Enrollments ({enrollments.length})
                </button>
            </div>

            {/* TAB 1: COURSES & TRACKS */}
            {activeTab === "courses" && (
                <div>
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                            Loading curriculum courses...
                        </div>
                    ) : courses.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center", background: "rgba(15, 23, 42, 0.4)", borderRadius: "18px", border: "1px dashed rgba(255, 255, 255, 0.1)" }}>
                            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📖</div>
                            <h3 style={{ margin: "0 0 6px", color: "#f8fafc" }}>No Courses Created Yet</h3>
                            <p style={{ margin: "0 0 16px", color: "#94a3b8" }}>
                                As the School Curriculum Specialist, create your first discipleship track or leadership course.
                            </p>
                            <button type="button" className="btn-primary" onClick={openCreateCourse}>
                                ＋ Create First Course
                            </button>
                        </div>
                    ) : (
                        <div className="studio-courses-grid">
                            {courses.map((c) => (
                                <div key={c.courseId} className="studio-course-card">
                                    <div className="studio-course-banner">
                                        <img
                                            src={c.thumbnailUrl || "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=60"}
                                            alt={c.title}
                                        />
                                        <div className="studio-course-banner-badges">
                                            <span className={`course-status-badge ${c.isPublished ? "published" : "draft"}`}>
                                                {c.isPublished ? "Published" : "Draft"}
                                            </span>
                                            {c.isFeatured && (
                                                <span className="course-status-badge published" style={{ background: "rgba(234, 179, 8, 0.9)" }}>
                                                    ★ Featured
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="studio-course-content">
                                        <span className="studio-course-category">
                                            {c.category || "Discipleship"} • {c.level || "All Levels"}
                                        </span>
                                        <h3 className="studio-course-title">{c.title}</h3>
                                        <div className="studio-course-specialist">
                                            <span>👤 Specialist:</span>
                                            <strong style={{ color: "#e2e8f0" }}>{c.instructorName || "Pastor Ronnel M. Aviguetero"}</strong>
                                        </div>

                                        {c.googleClassroomUrl && (
                                            <div style={{ fontSize: "11px", color: "#fbbf24", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                                                <span>🏫</span> Google Classroom Connected
                                            </div>
                                        )}

                                        <div className="studio-course-meta">
                                            <span>📑 {c.moduleCount || 0} Modules</span>
                                            <span>📖 {c.lessonCount || 0} Lessons</span>
                                            <span>⏱ {c.estimatedMinutes || 60}m</span>
                                        </div>
                                    </div>

                                    <div className="studio-course-actions">
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                onClick={() => openEditCourse(c.courseId)}
                                            >
                                                ✏ Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                onClick={() => openAddModule(c.courseId)}
                                            >
                                                ＋ Module
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                onClick={() => openCreateLesson(c.courseId)}
                                            >
                                                ＋ Lesson
                                            </button>
                                        </div>

                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                style={{ padding: "6px 14px", fontSize: "12px" }}
                                                onClick={() => onViewCourse(c.courseId)}
                                            >
                                                View Course →
                                            </button>
                                            <button
                                                type="button"
                                                style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "4px 8px" }}
                                                onClick={() => handleDeleteCourse(c.courseId, c.title)}
                                                title="Delete Course"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: READY-MADE TEMPLATES LIBRARY */}
            {activeTab === "templates" && (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "#f8fafc" }}>
                            Professional Ready-Made Curriculum & Lesson Templates
                        </h2>
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                            Click "Use Template" on any pre-built structure to instantly create a complete lesson equipped with videos, Google Classroom links, and summative assessments.
                        </p>
                    </div>

                    <div className="studio-templates-grid">
                        {READY_MADE_LESSON_TEMPLATES.map((tpl) => (
                            <div key={tpl.id} className="studio-template-card">
                                <div>
                                    <div className="studio-template-top">
                                        <div className="studio-template-icon">{tpl.icon}</div>
                                        <div className="studio-template-info">
                                            <h3>{tpl.name}</h3>
                                            <p>{tpl.description}</p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", fontSize: "12px", color: "#cbd5e1" }}>
                                        <div style={{ marginBottom: "4px" }}>
                                            <strong style={{ color: "#60a5fa" }}>Category:</strong> {tpl.category}
                                        </div>
                                        <div style={{ marginBottom: "4px" }}>
                                            <strong style={{ color: "#34d399" }}>Duration:</strong> ~{tpl.estimatedMinutes} minutes
                                        </div>
                                        <div>
                                            <strong style={{ color: "#fbbf24" }}>Summative Quiz:</strong> {tpl.defaultQuiz?.questions.length || 0} pre-made questions included ({tpl.defaultQuiz?.passingScorePercent || 80}% passing)
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: "20px" }}>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ width: "100%", justifyContent: "center" }}
                                        onClick={() => openCreateLesson(undefined, tpl.id)}
                                    >
                                        ⚡ Use This Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: SUMMATIVE ASSESSMENTS */}
            {activeTab === "assessments" && (
                <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "24px" }}>
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#f8fafc" }}>
                                Summative Assessment Engine & Question Banks
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                Manage test banks, passing scores, and examination verification across all church courses.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => openCreateLesson(undefined, "summative_exam_mastery")}
                        >
                            ＋ New Summative Exam
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                        {courses.map((c) => (
                            <div key={c.courseId} style={{ padding: "16px", background: "rgba(30, 41, 59, 0.5)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                                <strong style={{ color: "#f8fafc", fontSize: "14px", display: "block" }}>{c.title}</strong>
                                <small style={{ color: "#94a3b8" }}>Course ID #{c.courseId} • {c.lessonCount} Lessons</small>
                                <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700 }}>
                                        ✓ 80% Passing Threshold
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ padding: "4px 10px", fontSize: "11px" }}
                                        onClick={() => onViewCourse(c.courseId)}
                                    >
                                        Inspect
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: STUDENT ENROLLMENTS */}
            {activeTab === "enrollments" && (
                <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "24px" }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#f8fafc" }}>
                            Church Member Enrollments & Discipleship Progress
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                            School curriculum specialist view of enrolled church members and progress toward completion.
                        </p>
                    </div>

                    {loadingEnrollments ? (
                        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>Loading enrollments...</div>
                    ) : enrollments.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                            No students currently enrolled in courses.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255, 255, 255, 0.04)", textAlign: "left", color: "#94a3b8" }}>
                                        <th style={{ padding: "12px 14px" }}>STUDENT / MEMBER</th>
                                        <th style={{ padding: "12px 14px" }}>COURSE TRACK</th>
                                        <th style={{ padding: "12px 14px" }}>PROGRESS</th>
                                        <th style={{ padding: "12px 14px" }}>STATUS</th>
                                        <th style={{ padding: "12px 14px" }}>ENROLLED DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((en: any) => (
                                        <tr key={en.courseEnrollmentId} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#f8fafc" }}>
                                                {en.user?.fullName || en.userName || `User #${en.userId}`}
                                            </td>
                                            <td style={{ padding: "12px 14px", color: "#60a5fa" }}>
                                                {en.course?.title || `Course #${en.courseId}`}
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ flex: 1, height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div style={{ width: `${en.progressPercentage || 0}%`, height: "100%", background: "#3b82f6" }} />
                                                    </div>
                                                    <span style={{ fontSize: "11px", fontWeight: 700 }}>{en.progressPercentage || 0}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <span style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: "6px",
                                                    background: en.isCompleted ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                                    color: en.isCompleted ? "#34d399" : "#60a5fa"
                                                }}>
                                                    {en.isCompleted ? "COMPLETED" : "IN PROGRESS"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                                                {en.enrolledDate ? new Date(en.enrolledDate).toLocaleDateString() : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE / EDIT COURSE MODAL */}
            {showCourseModal && (
                <div className="studio-modal-overlay">
                    <div className="studio-modal-card">
                        <div className="studio-modal-header">
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
                                {editingCourseId ? "Edit Course Track" : "Create New Course / Curriculum"}
                            </h3>
                            <button
                                type="button"
                                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
                                onClick={() => setShowCourseModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSaveCourse}>
                            <div className="studio-modal-body">
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Course Title *
                                    </label>
                                    <input
                                        className="editor-input"
                                        value={courseForm.title}
                                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                                        placeholder="e.g. Foundations of Christian Discipleship"
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                            Curriculum Specialist / Instructor
                                        </label>
                                        <input
                                            className="editor-input"
                                            value={courseForm.instructorName}
                                            onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })}
                                            placeholder="Pastor Ronnel M. Aviguetero"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                            Category
                                        </label>
                                        <select
                                            className="editor-select"
                                            value={courseForm.category}
                                            onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                                        >
                                            <option value="Discipleship">Discipleship</option>
                                            <option value="Leadership">Leadership Institute</option>
                                            <option value="Bible School">Bible School</option>
                                            <option value="Sunday School">Sunday School</option>
                                            <option value="Youth">Youth Ministry</option>
                                            <option value="Worship & Arts">Worship & Arts</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                            Level
                                        </label>
                                        <select
                                            className="editor-select"
                                            value={courseForm.level}
                                            onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                            <option value="Leadership">Leadership</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                            Estimated Minutes
                                        </label>
                                        <input
                                            type="number"
                                            className="editor-input"
                                            value={courseForm.estimatedMinutes}
                                            onChange={(e) => setCourseForm({ ...courseForm, estimatedMinutes: Number(e.target.value) })}
                                            min={10}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Thumbnail Image URL
                                    </label>
                                    <input
                                        className="editor-input"
                                        value={courseForm.thumbnailUrl}
                                        onChange={(e) => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Google Classroom Link (Optional)
                                    </label>
                                    <input
                                        className="editor-input"
                                        value={courseForm.googleClassroomUrl}
                                        onChange={(e) => setCourseForm({ ...courseForm, googleClassroomUrl: e.target.value })}
                                        placeholder="https://classroom.google.com/..."
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Google Sheets Gradebook / Roster Link (Optional)
                                    </label>
                                    <input
                                        className="editor-input"
                                        value={courseForm.googleSheetsUrl}
                                        onChange={(e) => setCourseForm({ ...courseForm, googleSheetsUrl: e.target.value })}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Description & Syllabus
                                    </label>
                                    <textarea
                                        className="editor-textarea"
                                        style={{ minHeight: "90px" }}
                                        value={courseForm.description}
                                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                        placeholder="Provide an overview of this curriculum track..."
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "20px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                        <input
                                            type="checkbox"
                                            checked={courseForm.isPublished}
                                            onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                                            style={{ accentColor: "#10b981" }}
                                        />
                                        Published
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                        <input
                                            type="checkbox"
                                            checked={courseForm.isFeatured}
                                            onChange={(e) => setCourseForm({ ...courseForm, isFeatured: e.target.checked })}
                                            style={{ accentColor: "#3b82f6" }}
                                        />
                                        Featured on LMS Home
                                    </label>
                                </div>
                            </div>

                            <div className="studio-modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCourseModal(false)} disabled={savingCourse}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={savingCourse}>
                                    {savingCourse ? "Saving..." : editingCourseId ? "Update Course" : "Create Course"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD MODULE MODAL */}
            {showModuleModal && (
                <div className="studio-modal-overlay">
                    <div className="studio-modal-card" style={{ maxWidth: "500px" }}>
                        <div className="studio-modal-header">
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>Add Course Module</h3>
                            <button
                                type="button"
                                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
                                onClick={() => setShowModuleModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSaveModule}>
                            <div className="studio-modal-body">
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Module Title *
                                    </label>
                                    <input
                                        className="editor-input"
                                        value={moduleTitle}
                                        onChange={(e) => setModuleTitle(e.target.value)}
                                        placeholder="e.g. Module 2: Walking with the Holy Spirit"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                                        Description
                                    </label>
                                    <textarea
                                        className="editor-textarea"
                                        style={{ minHeight: "80px" }}
                                        value={moduleDesc}
                                        onChange={(e) => setModuleDesc(e.target.value)}
                                        placeholder="Brief description of this module's topics..."
                                    />
                                </div>
                            </div>
                            <div className="studio-modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModuleModal(false)} disabled={savingModule}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={savingModule}>
                                    {savingModule ? "Saving..." : "Add Module"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LESSON EDITOR MODAL */}
            <LessonEditorModal
                isOpen={lessonModalOpen}
                onClose={() => setLessonModalOpen(false)}
                courseId={lessonModalCourseId}
                courseTitle={lessonModalCourseTitle}
                modules={lessonModalModules}
                initialLesson={editingLessonData}
                initialTemplateId={lessonModalInitialTemplate}
                onSaved={() => {
                    loadCourses();
                }}
            />
        </div>
    );
};
