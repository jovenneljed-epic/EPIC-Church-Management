// ============================================================
// MySpiritualJourneyPortal.tsx
// EPIC CHURCH MANAGEMENT SYSTEM - Luke 4:18 Ministries
// Module: Member-Facing Transformation Portal (Unbeliever -> Disciple -> Leader)
//
// Gives every member full transparency:
// 1. Where they are right now (Step X of 7)
// 2. Where they should become (Target Next Milestone & Criteria)
// 3. Daily Secret Place Altar habit streak tracker
// 4. Weekly & Monthly discipleship rhythms
// 5. 1-Click bridge to EPIC Learning Studio (GEN-101 to GEN-501)
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    TrendingUp,
    CheckCircle2,
    Lock,
    Sparkles,
    Flame,
    BookOpen,
    ArrowRight,
    Award,
    Calendar,
    Users,
    ShieldCheck,
    Compass,
    Printer,
    X,
    Crown,
    Target,
    Search,
    ChevronDown,
    User,
} from "lucide-react";

import "./MySpiritualJourneyPortal.css";
import {
    epicTransformationService,
    TRANSFORMATION_STEPS_DEFINITIONS,
    type MemberTransformationState,
} from "../../services/epicTransformationService";
import epicGenerationsCurriculumService from "../../services/epicGenerationsCurriculum";
import PermissionService from "../../PermissionService";
import { discipleshipWebService } from "../../services/discipleshipWebService";

interface MySpiritualJourneyPortalProps {
    memberId?: number;
    memberName?: string;
    memberCode?: string;
    loggedInUser?: { fullName: string; role: string };
    onNavigateToCourse?: (courseId: number) => void;
    onNavigateToCMS?: () => void;
}

export const MySpiritualJourneyPortal: React.FC<MySpiritualJourneyPortalProps> = ({
    memberId: propMemberId,
    memberName: propMemberName,
    memberCode: propMemberCode,
    loggedInUser,
    onNavigateToCourse,
    onNavigateToCMS,
}) => {
    // 1. Determine if Admin / Overseer
    const isAdmin = useMemo(() => {
        if (loggedInUser) {
            const role = (loggedInUser.role || "").toUpperCase();
            const name = (loggedInUser.fullName || "").toLowerCase();
            return (
                role.includes("ADMIN") ||
                role.includes("PASTOR") ||
                role.includes("OVERSEER") ||
                (role.length > 0 && role !== "MEMBER") ||
                name.includes("admin") ||
                name.includes("ronnel") ||
                name.includes("pastor") ||
                PermissionService.isAdministrator()
            );
        }
        return PermissionService.isAdministrator();
    }, [loggedInUser]);

    // 2. Members List (for Admin Switcher)
    const [membersList, setMembersList] = useState<any[]>(() => {
        try {
            if (typeof window !== "undefined" && (window as any).__epicMembersCache) {
                const c = (window as any).__epicMembersCache;
                if (Array.isArray(c) && c.length > 0) return c;
            }
            const stored = localStorage.getItem("epic_members") || localStorage.getItem("members");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return [];
    });

    useEffect(() => {
        if (membersList.length === 0) {
            discipleshipWebService.getChurchMembers().then((list) => {
                if (list && list.length > 0) setMembersList(list);
            }).catch(() => {});
        }
    }, [membersList.length]);

    // 3. Active Disciple Identity
    const [activeMemberId, setActiveMemberId] = useState<number>(() => {
        if (propMemberId) return propMemberId;
        if (isAdmin) return 99999;
        return 1;
    });

    const [activeMemberName, setActiveMemberName] = useState<string>(() => {
        if (propMemberName) return propMemberName;
        if (isAdmin) return loggedInUser?.fullName || "Pastor Ronnel M. Aviguetero";
        return loggedInUser?.fullName || "Believer";
    });

    const [activeMemberCode, setActiveMemberCode] = useState<string>(() => {
        if (propMemberCode) return propMemberCode;
        if (isAdmin) return "EPIC-PASTOR-01";
        return "EPIC-01";
    });

    // Sync if props change
    useEffect(() => {
        if (propMemberId) {
            setActiveMemberId(propMemberId);
            if (propMemberName) setActiveMemberName(propMemberName);
            if (propMemberCode) setActiveMemberCode(propMemberCode);
        }
    }, [propMemberId, propMemberName, propMemberCode]);

    // Searchable Disciple Switcher State
    const disciplePickerRef = useRef<HTMLDivElement>(null);
    const [isDisciplePickerOpen, setIsDisciplePickerOpen] = useState(false);
    const [discipleSearchQuery, setDiscipleSearchQuery] = useState("");

    // Click outside & Escape key listeners
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (disciplePickerRef.current && !disciplePickerRef.current.contains(e.target as Node)) {
                setIsDisciplePickerOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsDisciplePickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const filteredMembers = useMemo(() => {
        const q = discipleSearchQuery.trim().toLowerCase();
        if (!q) return membersList;
        return membersList.filter((m) => {
            const name = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).toLowerCase();
            const code = (m.memberCode || `epic-${m.memberId}`).toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [membersList, discipleSearchQuery]);

    // --------------------------------------------------------
    // STATE
    // --------------------------------------------------------
    const [state, setState] = useState<MemberTransformationState>(() =>
        epicTransformationService.getMemberState(activeMemberId, activeMemberName, activeMemberCode)
    );
    const [selectedStepNum, setSelectedStepNum] = useState<number>(() => state.currentStep);
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certStepNum, setCertStepNum] = useState<number>(state.currentStep);

    // Refresh state when events fire
    const reloadState = useCallback(() => {
        const fresh = epicTransformationService.getMemberState(activeMemberId, activeMemberName, activeMemberCode);
        setState(fresh);
    }, [activeMemberId, activeMemberName, activeMemberCode]);

    useEffect(() => {
        reloadState();
        const handleUpdate = () => reloadState();
        window.addEventListener("epic-transformation-updated", handleUpdate);
        window.addEventListener("epic-curriculum-updated", handleUpdate);
        return () => {
            window.removeEventListener("epic-transformation-updated", handleUpdate);
            window.removeEventListener("epic-curriculum-updated", handleUpdate);
        };
    }, [reloadState]);

    // Keep selected step in sync with current step if not manually browsing
    useEffect(() => {
        setSelectedStepNum(state.currentStep);
    }, [state.currentStep]);

    // --------------------------------------------------------
    // DERIVED COMPUTATIONS
    // --------------------------------------------------------
    const currentStepDef = useMemo(
        () => epicTransformationService.getStepDefinition(state.currentStep),
        [state.currentStep]
    );

    const selectedStepDef = useMemo(
        () => epicTransformationService.getStepDefinition(selectedStepNum),
        [selectedStepNum]
    );

    const nextStepDef = useMemo(
        () =>
            state.currentStep < 7
                ? epicTransformationService.getStepDefinition(state.currentStep + 1)
                : null,
        [state.currentStep]
    );

    const eligibility = useMemo(
        () => epicTransformationService.checkEligibilityToAdvance(activeMemberId, state),
        [activeMemberId, state]
    );

    // Curriculum progress for current active stage
    const stageProgress = useMemo(() => {
        const stageNum = currentStepDef.stage || 1;
        return epicGenerationsCurriculumService.getStageProgress(stageNum);
    }, [currentStepDef.stage]);

    // --------------------------------------------------------
    // HANDLERS
    // --------------------------------------------------------
    const handleToggleHabit = (habitKey: "word" | "prayer" | "gratitude") => {
        const updated = epicTransformationService.toggleDailyHabit(
            activeMemberId,
            habitKey,
            state.fullName
        );
        setState(updated);
    };

    const handleContinueCourse = () => {
        const courseId = (currentStepDef.stage || 1) * 100 + 1;
        if (onNavigateToCourse) {
            onNavigateToCourse(courseId);
        } else {
            try {
                localStorage.setItem("epic_target_course_id", String(courseId));
                window.dispatchEvent(
                    new CustomEvent("epic-open-course", { detail: { courseId } })
                );
            } catch {}
        }
    };

    const handleOpenCertificate = (step: number) => {
        setCertStepNum(step);
        setIsCertModalOpen(true);
    };

    const handlePrintCertificate = () => {
        window.print();
    };

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------
    return (
        <div className="msj-container">
            {/* 1. HERO PROFILE BANNER */}
            <div className="msj-hero-card">
                <div className="msj-hero-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span className="msj-pill-tag">
                            <Sparkles size={14} style={{ color: "#5eead4" }} />
                            <span>EPIC Discipleship Journey • Luke 4:18 Ministries</span>
                        </span>

                        {/* Admin / Shepherd Searchable Disciple Switcher */}
                        {isAdmin && (
                            <div className="msj-admin-disciple-picker" ref={disciplePickerRef}>
                                <span className="msj-disciple-picker-label">
                                    Viewing As:
                                </span>

                                <button
                                    type="button"
                                    className="msj-disciple-trigger-btn"
                                    onClick={() => setIsDisciplePickerOpen((prev) => !prev)}
                                    title="Click to search and switch disciple profile"
                                >
                                    <span className="msj-disciple-trigger-text">
                                        {activeMemberId === 99999 ? (
                                            <>
                                                <Crown size={13} style={{ color: "#fbbf24" }} />
                                                <span>{loggedInUser?.fullName || "System Administrator"} (Leader Profile • Step 7)</span>
                                            </>
                                        ) : (
                                            <>
                                                <User size={13} style={{ color: "#5eead4" }} />
                                                <span>{activeMemberName} ({activeMemberCode})</span>
                                            </>
                                        )}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            transform: isDisciplePickerOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                            flexShrink: 0
                                        }}
                                    />
                                </button>

                                {activeMemberId !== 99999 && (
                                    <button
                                        type="button"
                                        className="msj-disciple-reset-btn"
                                        title="Reset view back to Admin Leader Profile"
                                        onClick={() => {
                                            setActiveMemberId(99999);
                                            setActiveMemberName(loggedInUser?.fullName || "System Administrator");
                                            setActiveMemberCode("EPIC-PASTOR-01");
                                        }}
                                    >
                                        <X size={12} />
                                        <span>My Profile</span>
                                    </button>
                                )}

                                {/* Popover Dropdown with Search Bar */}
                                {isDisciplePickerOpen && (
                                    <div className="msj-disciple-dropdown-popover">
                                        {/* Search Input Bar */}
                                        <div className="msj-disciple-search-box">
                                            <Search size={14} className="msj-disciple-search-icon" />
                                            <input
                                                type="text"
                                                className="msj-disciple-search-input"
                                                placeholder="Search by disciple name or code..."
                                                value={discipleSearchQuery}
                                                onChange={(e) => setDiscipleSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            {discipleSearchQuery && (
                                                <button
                                                    type="button"
                                                    className="msj-disciple-search-clear"
                                                    onClick={() => setDiscipleSearchQuery("")}
                                                    title="Clear search"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="msj-disciple-results-count">
                                            <span>
                                                {discipleSearchQuery
                                                    ? `${filteredMembers.length} matches found`
                                                    : `Church Disciples & Members (${membersList.length})`}
                                            </span>
                                        </div>

                                        <div className="msj-disciple-items-scroll">
                                            {/* Default Admin / Leader Option */}
                                            {(!discipleSearchQuery ||
                                              "system administrator leader pastor ronnel profile step 7".includes(discipleSearchQuery.toLowerCase())) && (
                                                <button
                                                    type="button"
                                                    className={`msj-disciple-item ${activeMemberId === 99999 ? "selected" : ""}`}
                                                    onClick={() => {
                                                        setActiveMemberId(99999);
                                                        setActiveMemberName(loggedInUser?.fullName || "System Administrator");
                                                        setActiveMemberCode("EPIC-PASTOR-01");
                                                        setIsDisciplePickerOpen(false);
                                                        setDiscipleSearchQuery("");
                                                    }}
                                                >
                                                    <div className="msj-disciple-avatar leader">
                                                        <Crown size={13} />
                                                    </div>
                                                    <div className="msj-disciple-info">
                                                        <div className="msj-disciple-name">
                                                            {loggedInUser?.fullName || "System Administrator"}
                                                        </div>
                                                        <div className="msj-disciple-sub">
                                                            Leader Profile • Step 7 (Multiply)
                                                        </div>
                                                    </div>
                                                    {activeMemberId === 99999 && (
                                                        <CheckCircle2 size={14} className="msj-disciple-check" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Filtered Disciples */}
                                            {filteredMembers.map((m) => {
                                                const fName = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
                                                const code = m.memberCode || `EPIC-${m.memberId}`;
                                                const isSelected = m.memberId === activeMemberId;
                                                const initials = fName
                                                    .split(" ")
                                                    .map((n: string) => n[0])
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase() || "M";

                                                return (
                                                    <button
                                                        key={m.memberId}
                                                        type="button"
                                                        className={`msj-disciple-item ${isSelected ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setActiveMemberId(m.memberId);
                                                            setActiveMemberName(fName);
                                                            setActiveMemberCode(code);
                                                            setIsDisciplePickerOpen(false);
                                                            setDiscipleSearchQuery("");
                                                        }}
                                                    >
                                                        <div className="msj-disciple-avatar">
                                                            {initials}
                                                        </div>
                                                        <div className="msj-disciple-info">
                                                            <div className="msj-disciple-name">
                                                                {fName}
                                                            </div>
                                                            <div className="msj-disciple-sub">
                                                                {code} {m.roleName ? `• ${m.roleName}` : ""}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 size={14} className="msj-disciple-check" />
                                                        )}
                                                    </button>
                                                );
                                            })}

                                            {filteredMembers.length === 0 && (
                                                <div className="msj-disciple-empty">
                                                    No disciples found matching "{discipleSearchQuery}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {onNavigateToCMS && (
                            <button
                                type="button"
                                className="msj-btn-outline"
                                style={{
                                    borderColor: "rgba(255,255,255,0.4)",
                                    color: "#ffffff",
                                    background: "rgba(255,255,255,0.1)",
                                }}
                                onClick={onNavigateToCMS}
                            >
                                <Compass size={14} />
                                <span>360° Pastoral Radar ↗</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className="msj-btn-outline"
                            style={{
                                borderColor: "rgba(255,255,255,0.4)",
                                color: "#ffffff",
                                background: "rgba(255,255,255,0.1)",
                            }}
                            onClick={() => handleOpenCertificate(state.currentStep)}
                        >
                            <Award size={14} />
                            <span>View Certificate</span>
                        </button>
                    </div>
                </div>

                <div className="msj-hero-main">
                    <div className="msj-hero-profile">
                        <div className="msj-avatar-large">
                            {state.fullName.charAt(0)}
                        </div>
                        <div className="msj-hero-title-group">
                            <h1>{state.fullName}</h1>
                            <div className="msj-hero-meta-row">
                                <span className="msj-meta-badge">
                                    {state.memberCode}
                                </span>
                                <span>•</span>
                                <span className="msj-meta-badge" style={{ background: "rgba(20, 184, 166, 0.35)", color: "#99f6e4" }}>
                                    {currentStepDef.generationLevel} • {currentStepDef.role}
                                </span>
                                <span>•</span>
                                <span>👑 Spiritual Parent: <strong>{state.spiritualParent}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Gauges Strip */}
                    <div className="msj-hero-gauges">
                        <div className="msj-gauge-box">
                            <div className="msj-gauge-label">Milestone</div>
                            <div className="msj-gauge-value" style={{ color: "#5eead4" }}>
                                Step {state.currentStep}/7
                            </div>
                            <div className="msj-gauge-sub">{currentStepDef.phase} Phase</div>
                        </div>

                        <div className="msj-gauge-box">
                            <div className="msj-gauge-label">Maturity Index</div>
                            <div className="msj-gauge-value">{state.maturityIndex}%</div>
                            <div className="msj-gauge-sub">Health: {state.healthScore}/10</div>
                        </div>

                        <div className="msj-gauge-box" style={{ background: "rgba(245, 158, 11, 0.2)", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                            <div className="msj-gauge-label" style={{ color: "#fef08a" }}>
                                Altar Streak
                            </div>
                            <div className="msj-gauge-value" style={{ color: "#fef08a", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                <Flame size={22} style={{ color: "#f59e0b" }} />
                                <span>{state.altarStreakDays} Days</span>
                            </div>
                            <div className="msj-gauge-sub" style={{ color: "#fef3c7" }}>Daily Secret Place</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THE 7-STEP INTERACTIVE TRANSFORMATION TRACK */}
            <div className="msj-card">
                <div className="msj-card-title-row">
                    <h2 className="msj-card-title">
                        <TrendingUp size={20} style={{ color: "#0d9488" }} />
                        <span>The 7-Step Discipleship Roadmap: Unbeliever to Kingdom Leader</span>
                    </h2>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Click any milestone below to inspect requirements & exit gates
                    </span>
                </div>
                <p className="msj-card-subtitle">
                    Every member undergoes this intentional biblical process: Win, Consolidate, Disciple, Equip, Send, and Multiply.
                </p>

                <div className="msj-stepper-track">
                    {TRANSFORMATION_STEPS_DEFINITIONS.map((step) => {
                        const isDone = state.currentStep > step.step;
                        const isCurrent = state.currentStep === step.step;
                        const isSelected = selectedStepNum === step.step;

                        return (
                            <button
                                key={step.step}
                                type="button"
                                className={`msj-step-pill ${isDone ? "completed" : isCurrent ? "active" : "upcoming"} ${isSelected ? "selected" : ""}`}
                                onClick={() => setSelectedStepNum(step.step)}
                            >
                                <div>
                                    <div className="msj-step-num-badge">
                                        Step {step.step} • {step.phase}
                                    </div>
                                    <div className="msj-step-name">{step.title}</div>
                                    <div className="msj-step-role">{step.role}</div>
                                </div>
                                <div>
                                    <span
                                        className={`msj-step-chip ${isDone ? "done" : isCurrent ? "current" : "locked"}`}
                                    >
                                        {isDone ? "✓ Completed" : isCurrent ? "● You Are Here" : "🔒 Upcoming"}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. TWO-COLUMN: WHERE YOU ARE NOW vs WHERE YOU SHOULD BECOME */}
            <div className="msj-two-col">
                {/* COLUMN A: CURRENT MILESTONE FOCUS */}
                <div className="msj-focus-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="msj-badge-soft current">
                            <Sparkles size={12} />
                            <span>Where You Are Right Now</span>
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#0d9488" }}>
                            Step {selectedStepDef.step} of 7 ({selectedStepDef.phase})
                        </span>
                    </div>

                    <h3 className="msj-focus-title">{selectedStepDef.title}</h3>
                    <p className="msj-focus-subtitle">{selectedStepDef.subTitle}</p>

                    {/* Scripture Anchor */}
                    <div className="msj-scripture-quote">
                        “{selectedStepDef.scriptureVerse}”
                        <span className="msj-scripture-ref">
                            📖 {selectedStepDef.scriptureAnchor}
                        </span>
                    </div>

                    {/* Academic Course Status */}
                    {selectedStepDef.stage && (
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                                <strong>{selectedStepDef.courseTitle}</strong>
                                <span style={{ fontWeight: "800", color: "#0d9488" }}>
                                    {stageProgress.progressPercentage}%
                                </span>
                            </div>
                            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                                <div
                                    style={{
                                        width: `${stageProgress.progressPercentage}%`,
                                        height: "100%",
                                        background: stageProgress.isCompleted ? "#10b981" : "linear-gradient(90deg, #0d9488, #2563eb)",
                                        borderRadius: "999px",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                                <span>{stageProgress.completedCount} of {stageProgress.totalLessons} Lessons Finished</span>
                                <span>{stageProgress.isCompleted ? "✓ Stage Certified" : "Prerequisite for next stage"}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            className="msj-btn-primary"
                            onClick={handleContinueCourse}
                        >
                            <BookOpen size={16} />
                            <span>Continue {selectedStepDef.courseCode} in Studio</span>
                            <ArrowRight size={14} />
                        </button>

                        {state.currentStep > selectedStepDef.step && (
                            <button
                                type="button"
                                className="msj-btn-outline"
                                onClick={() => handleOpenCertificate(selectedStepDef.step)}
                            >
                                <Award size={15} />
                                <span>View Milestone Diploma</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* COLUMN B: WHERE YOU SHOULD BECOME NEXT */}
                <div className="msj-next-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="msj-badge-soft target">
                            <Target size={12} />
                            <span>Where You Should Become Next</span>
                        </span>
                        {nextStepDef ? (
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#4f46e5" }}>
                                Target: Step {nextStepDef.step} of 7
                            </span>
                        ) : (
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#16a34a" }}>
                                ★ Highest Level Reached
                            </span>
                        )}
                    </div>

                    {nextStepDef ? (
                        <>
                            <h3 className="msj-focus-title" style={{ color: "#312e81" }}>
                                {nextStepDef.title}
                            </h3>
                            <p className="msj-focus-subtitle">
                                Target Role: <strong>{nextStepDef.role}</strong> ({nextStepDef.generationLevel})
                            </p>

                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "14px" }}>
                                🚪 Exit Gates to Cross Before Advancement:
                            </div>

                            <ul className="msj-checklist">
                                {nextStepDef.clearanceGates.map((gate, idx) => {
                                    const isDone = eligibility.satisfiedGates.includes(gate);
                                    return (
                                        <li
                                            key={idx}
                                            className={`msj-checklist-item ${isDone ? "done" : ""}`}
                                        >
                                            <div className="msj-check-icon">
                                                {isDone ? (
                                                    <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
                                                ) : (
                                                    <Lock size={15} style={{ color: "#94a3b8" }} />
                                                )}
                                            </div>
                                            <div>
                                                <strong>{gate}</strong>
                                                <div style={{ fontSize: "11px", color: isDone ? "#16a34a" : "#64748b" }}>
                                                    {isDone ? "✓ Prerequisite Satisfied" : "Pending completion & pastoral sign-off"}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div style={{ marginTop: "18px", padding: "12px 14px", background: eligibility.canAdvance ? "#f0fdf4" : "#eff6ff", borderRadius: "10px", border: eligibility.canAdvance ? "1px solid #86efac" : "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <strong style={{ fontSize: "12px", color: eligibility.canAdvance ? "#15803d" : "#1e40af" }}>
                                        {eligibility.canAdvance ? "🎉 Ready for Milestone Sign-Off!" : "⏳ In Discipleship Formation"}
                                    </strong>
                                    <div style={{ fontSize: "11px", color: "#475569" }}>
                                        {eligibility.canAdvance
                                            ? "Request your Spiritual Parent or Pastor to officially clear this gate."
                                            : "Keep faithful in your daily altar and stage course."}
                                    </div>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 8px", borderRadius: "4px", background: eligibility.canAdvance ? "#dcfce7" : "#dbeafe", color: eligibility.canAdvance ? "#15803d" : "#1e40af" }}>
                                    {eligibility.canAdvance ? "Eligible" : "In Progress"}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: "30px 20px", textAlign: "center", color: "#15803d" }}>
                            <Crown size={48} style={{ color: "#eab308", margin: "0 auto 12px" }} />
                            <h3 style={{ margin: "0 0 6px" }}>Movement Catalyzer Certified!</h3>
                            <p style={{ fontSize: "13px", color: "#475569" }}>
                                You have reached Step 7 of the G12 Transformation Pipeline. Continue mentoring your 12 leaders and multiplying regional cluster hubs.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. DAILY SECRET PLACE ALTAR HABIT TRACKER */}
            <div className="msj-card">
                <div className="msj-card-title-row">
                    <h2 className="msj-card-title">
                        <Flame size={20} style={{ color: "#f59e0b" }} />
                        <span>Daily Secret Place Altar: Keep the Fire Burning (Leviticus 6:13)</span>
                    </h2>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#d97706", background: "#fef3c7", padding: "3px 10px", borderRadius: "999px" }}>
                        🔥 {state.altarStreakDays}-Day Unbroken Devotional Streak
                    </span>
                </div>
                <p className="msj-card-subtitle">
                    True spiritual transformation begins in the secret place with Jesus. Tap each daily habit below as you complete it today:
                </p>

                <div className="msj-habits-grid">
                    {/* Habit 1: Word */}
                    <button
                        type="button"
                        className={`msj-habit-btn ${state.todayHabits.word ? "checked" : ""}`}
                        onClick={() => handleToggleHabit("word")}
                    >
                        <span className="msj-habit-icon">📖</span>
                        <span className="msj-habit-title">Word of God</span>
                        <span className="msj-habit-desc">Read today's scripture passage & reflect on God's truth</span>
                        <span className="msj-habit-status">
                            {state.todayHabits.word ? "✓ Done Today" : "+ Tap to Check In"}
                        </span>
                    </button>

                    {/* Habit 2: Prayer */}
                    <button
                        type="button"
                        className={`msj-habit-btn ${state.todayHabits.prayer ? "checked" : ""}`}
                        onClick={() => handleToggleHabit("prayer")}
                    >
                        <span className="msj-habit-icon">🙏</span>
                        <span className="msj-habit-title">Secret Place Prayer</span>
                        <span className="msj-habit-desc">Communion, worship & intercession for family and church</span>
                        <span className="msj-habit-status">
                            {state.todayHabits.prayer ? "✓ Done Today" : "+ Tap to Check In"}
                        </span>
                    </button>

                    {/* Habit 3: Gratitude */}
                    <button
                        type="button"
                        className={`msj-habit-btn ${state.todayHabits.gratitude ? "checked" : ""}`}
                        onClick={() => handleToggleHabit("gratitude")}
                    >
                        <span className="msj-habit-icon">✍️</span>
                        <span className="msj-habit-title">Gratitude & Testimony</span>
                        <span className="msj-habit-desc">Recorded 3 specific blessings and praised God</span>
                        <span className="msj-habit-status">
                            {state.todayHabits.gratitude ? "✓ Done Today" : "+ Tap to Check In"}
                        </span>
                    </button>
                </div>
            </div>

            {/* 5. WEEKLY & MONTHLY DISCIPLESHIP RHYTHMS */}
            <div className="msj-two-col">
                {/* Weekly Habits */}
                <div className="msj-card" style={{ marginBottom: 0 }}>
                    <h3 className="msj-card-title">
                        <Calendar size={18} style={{ color: "#0d9488" }} />
                        <span>Weekly Discipleship Rhythms</span>
                    </h3>
                    <p className="msj-card-subtitle" style={{ marginBottom: "14px" }}>
                        Consistency builds character. Habits practiced every single week:
                    </p>
                    <ul className="msj-checklist">
                        {selectedStepDef.weeklyRhythms.map((rh, i) => (
                            <li key={i} className="msj-checklist-item done">
                                <CheckCircle2 size={16} style={{ color: "#0d9488" }} />
                                <span>{rh}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Monthly & Accountability */}
                <div className="msj-card" style={{ marginBottom: 0 }}>
                    <h3 className="msj-card-title">
                        <ShieldCheck size={18} style={{ color: "#6366f1" }} />
                        <span>Monthly Rhythms & Pastoral Care</span>
                    </h3>
                    <p className="msj-card-subtitle" style={{ marginBottom: "14px" }}>
                        Spiritual alignment with your pastors and leaders:
                    </p>
                    <ul className="msj-checklist">
                        {selectedStepDef.monthlyRhythms.map((mr, i) => (
                            <li key={i} className="msj-checklist-item">
                                <Compass size={16} style={{ color: "#6366f1" }} />
                                <span>{mr}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 6. SPIRITUAL FAMILY & LINEAGE SNAPSHOT */}
            <div className="msj-card" style={{ marginTop: "24px" }}>
                <div className="msj-card-title-row">
                    <h3 className="msj-card-title">
                        <Users size={18} style={{ color: "#0d9488" }} />
                        <span>My Spiritual Family & Generational Lineage</span>
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                        2 Timothy 2:2 Discipleship Tree
                    </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                    <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "10px", padding: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>
                            👑 My Spiritual Parent / Discipler
                        </div>
                        <strong style={{ fontSize: "15px", color: "#134e4a", display: "block", marginTop: "4px" }}>
                            {state.spiritualParent}
                        </strong>
                        <div style={{ fontSize: "12px", color: "#0f766e", marginTop: "4px" }}>
                            Weekly 1-on-1 Discipleship • Direct Spiritual Covering
                        </div>
                    </div>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>
                            🌿 My Assigned Life Group
                        </div>
                        <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", marginTop: "4px" }}>
                            {state.lifeGroupName}
                        </strong>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            Leader: {state.lifeGroupLeader} • Meets Weekly
                        </div>
                    </div>

                    <div style={{ background: state.spiritualChildrenCount > 0 ? "#fdf4ff" : "#f8fafc", border: state.spiritualChildrenCount > 0 ? "1px solid #f0abfc" : "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: state.spiritualChildrenCount > 0 ? "#86198f" : "#64748b", textTransform: "uppercase" }}>
                            🌱 My Spiritual Children under Care
                        </div>
                        <strong style={{ fontSize: "15px", color: state.spiritualChildrenCount > 0 ? "#701a75" : "#0f172a", display: "block", marginTop: "4px" }}>
                            {state.spiritualChildrenCount} New Believer(s)
                        </strong>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            {state.spiritualChildrenCount > 0
                                ? "Actively guiding through 4-week consolidation visits"
                                : "Unlocks at Step 5 (School of Leaders Track)"}
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. OFFICIAL CERTIFICATE MODAL */}
            {isCertModalOpen && (
                <div className="msj-modal-backdrop" onClick={() => setIsCertModalOpen(false)}>
                    <div className="msj-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`cia-btn-outline small ${certStepNum === s ? "active" : ""}`}
                                        style={{
                                            padding: "2px 8px",
                                            fontSize: "11px",
                                            background: certStepNum === s ? "#0d9488" : "#ffffff",
                                            color: certStepNum === s ? "#ffffff" : "#0d9488",
                                        }}
                                        onClick={() => setCertStepNum(s)}
                                    >
                                        Step {s}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                                onClick={() => setIsCertModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Printable Certificate Frame */}
                        <div className="msj-cert-frame">
                            <div className="msj-cert-header">
                                EPIC Church • Luke 4:18 Ministries (San Vicente Church)
                            </div>
                            <h2 className="msj-cert-title">
                                Certificate of Discipleship Completion
                            </h2>
                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                Official Generational Leadership Framework Credential
                            </p>

                            <div style={{ margin: "20px 0" }}>
                                <span style={{ fontSize: "13px", color: "#475569" }}>This certifies that</span>
                                <div className="msj-cert-recipient">{state.fullName}</div>
                                <div style={{ fontSize: "11px", color: "#0d9488", fontWeight: "700" }}>
                                    {state.memberCode}
                                </div>
                            </div>

                            <p className="msj-cert-body">
                                Has faithfully fulfilled the biblical discipleship requirements, personal secret place altar disciplines, sound doctrine examination, and ministry qualifications for:
                            </p>

                            <div style={{ background: "rgba(13, 148, 136, 0.1)", border: "1.5px solid #0d9488", borderRadius: "8px", padding: "10px 18px", display: "inline-block", margin: "8px 0 16px" }}>
                                <strong style={{ fontSize: "16px", color: "#0f766e" }}>
                                    {epicTransformationService.getStepDefinition(certStepNum).title}
                                </strong>
                                <div style={{ fontSize: "12px", color: "#134e4a" }}>
                                    {epicTransformationService.getStepDefinition(certStepNum).subTitle}
                                </div>
                            </div>

                            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#475569", maxWidth: "480px", margin: "0 auto" }}>
                                “And what you have heard from me in the presence of many witnesses entrust to faithful men, who will be able to teach others also.” — 2 Timothy 2:2
                            </p>

                            <div className="msj-cert-footer">
                                <div className="msj-cert-sign">
                                    <div className="msj-cert-line" />
                                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                                        Pastor Ronnel M. Aviguetero
                                    </strong>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>Senior Pastor</div>
                                </div>

                                <div className="msj-cert-sign">
                                    <div className="msj-cert-line" />
                                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                                        Spiritual Parent / Shepherd
                                    </strong>
                                    <div style={{ fontSize: "10px", color: "#64748b" }}>Discipleship Overseer</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                            <button
                                type="button"
                                className="msj-btn-primary"
                                onClick={handlePrintCertificate}
                            >
                                <Printer size={15} />
                                <span>Print Official Certificate</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySpiritualJourneyPortal;
